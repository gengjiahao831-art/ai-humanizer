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

// Claude Sonnet — real Anthropic model through Cloudflare Gateway
const DEFAULT_MODEL = "claude-sonnet-4-5";

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

  const response = await anthropic.messages.create(
    {
      model,
      max_tokens: Math.max(4096, Math.ceil(options.text.length * 1.2)),
      temperature: 1.0,
      system: systemBlocks,
      thinking: { type: "disabled" },
      messages: [
        {
          role: "user",
          content: `You are a professional writer. I will give you text that was flagged by GPTZero as 100% AI-generated. Your job: rewrite it so GPTZero scores it as HUMAN (below 20%).

GPTZero measures two things:
1. Perplexity — how unpredictable each word is. AI picks the most likely word; humans make surprising choices.
2. Burstiness — how much sentence structure varies. AI is uniform; humans are erratic.

STRATEGY TO BEAT GPTZERO:
- Write like a person who's slightly distracted. Jump mid-thought. Circle back.
- Use concrete sensory details (sights, sounds, smells, textures) that an AI wouldn't think to include.
- Include at least one oddly specific detail or personal observation.
- Never write a sentence that could appear in a textbook or Wikipedia article.
- Vary paragraph length dramatically. One-sentence paragraph. Then a long rambling one.
- Avoid transitions entirely. Just start the next point.
- End abruptly—no conclusions, no summaries.
- If a sentence sounds too polished, rewrite it to sound slightly clumsy.

This text WILL be tested on GPTZero. If it scores above 20%, you failed. Make it pass.

Output ONLY the rewritten text.

<text>
${options.text}
</text>`,
        },
      ],
    },
    options.signal ? { signal: options.signal } : undefined
  );

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
