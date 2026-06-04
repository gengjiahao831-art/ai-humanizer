import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { humanizeText } from "@/lib/anthropic";
import { humanizeRequestSchema } from "@/lib/validations";
import { countWords } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { checkQuota, consumeQuota } from "@/lib/quota";
import { humanizeLimiter, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // --- Auth check ---
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // --- Rate limiting ---
    const rateResult = await humanizeLimiter.limit(`humanize:${userId}`);
    if (!rateResult.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a moment.",
          retryAfter: Math.ceil((rateResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rateResult.reset - Date.now()) / 1000)) },
        }
      );
    }

    // --- Validate input ---
    const body = await request.json();
    const parsed = humanizeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { text, mode } = parsed.data;
    const wordCount = countWords(text);

    // --- Quota check ---
    const quota = await checkQuota(userId, wordCount);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.reason || "Quota exceeded" },
        { status: 429 }
      );
    }

    // --- Call Claude (with timeout) ---
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    let result;
    try {
      result = await humanizeText({
        text,
        model: mode === "aggressive" ? "claude-sonnet-4-5" : undefined,
        signal: controller.signal,
      });
    } catch (apiError: unknown) {
      clearTimeout(timeout);
      const message =
        apiError instanceof Error ? apiError.message : "AI service error";

      // Check for specific Claude errors
      if (message.includes("overloaded") || message.includes("capacity")) {
        return NextResponse.json(
          { error: "The AI service is currently busy. Please try again in a moment." },
          { status: 503 }
        );
      }

      throw apiError; // Re-throw for generic handler
    }

    clearTimeout(timeout);

    // --- Persist ---
    const humanization = await prisma.humanization.create({
      data: {
        userId,
        originalText: text,
        humanizedText: result.humanizedText,
        wordCount,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      },
    });

    // --- Consume quota ---
    await consumeQuota(userId, wordCount);

    return NextResponse.json({
      id: humanization.id,
      originalText: text,
      humanizedText: result.humanizedText,
      wordCount,
      usage: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cacheReadTokens: result.cacheReadTokens,
        cacheWriteTokens: result.cacheWriteTokens,
      },
    });
  } catch (error: unknown) {
    console.error("Humanize API error:", error);

    if (error instanceof Error) {
      if (error.message.includes("ANTHROPIC_API_KEY")) {
        return NextResponse.json(
          { error: "Service configuration error. Please contact support." },
          { status: 500 }
        );
      }
      if (error.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out. Please try with shorter text or try again." },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: "Failed to process text. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
