import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

// Singleton Anthropic client
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Load the Humanizer system prompt once at module init
let systemPrompt: string | null = null;

function getSystemPrompt(): string {
  if (!systemPrompt) {
    const promptPath = join(process.cwd(), "src/lib/prompts/humanizer.txt");
    systemPrompt = readFileSync(promptPath, "utf-8");
  }
  return systemPrompt;
}

// Model to use — Haiku for MVP (cost-effective)
// Switch to "claude-sonnet-4-20250514" for higher quality (3x cost)
const DEFAULT_MODEL = "claude-haiku-4-20250514";

export interface HumanizeResult {
  humanizedText: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export interface HumanizeOptions {
  text: string;
  voiceSample?: string;
  model?: string;
  signal?: AbortSignal;
}

/**
 * Call Claude API to humanize text using the Humanizer system prompt.
 * Uses prompt caching for the system prompt to reduce costs ~72%.
 */
export async function humanizeText(
  options: HumanizeOptions
): Promise<HumanizeResult> {
  const anthropic = getClient();
  const systemPrompt = getSystemPrompt();
  const model = options.model || DEFAULT_MODEL;

  // Append voice sample to system prompt if provided
  const systemBlocks: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: systemPrompt,
      cache_control: { type: "ephemeral" },
    },
  ];

  if (options.voiceSample) {
    systemBlocks.push({
      type: "text",
      text: `\n\n## Voice Calibration Sample\nMatch this writing style in your rewrite. Analyze the sample's sentence length patterns, word choice, paragraph openings, punctuation habits, recurring phrases, and transition style — then apply those patterns:\n\n${options.voiceSample}`,
    });
  }

  const response = await anthropic.messages.create({
    model,
    max_tokens: Math.max(4096, Math.ceil(options.text.length * 0.8)),
    system: systemBlocks,
    signal: options.signal,
    messages: [
      {
        role: "user",
        content: `Humanize the following text. Follow the process outlined in the system prompt:

1. Identify every AI pattern present.
2. Write a draft rewrite.
3. Audit: "What makes this still obviously AI generated?"
4. Produce the final rewrite addressing those issues.

IMPORTANT: Output ONLY the final rewrite. Do not include the draft, the audit, or any explanations. Just the humanized text.

<text>
${options.text}
</text>`,
      },
    ],
  });

  // Extract the text response
  const textBlock = response.content.find((block) => block.type === "text");

  return {
    humanizedText: textBlock?.type === "text" ? textBlock.text : "",
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens || 0,
    cacheWriteTokens: response.usage.cache_creation_input_tokens || 0,
  };
}
