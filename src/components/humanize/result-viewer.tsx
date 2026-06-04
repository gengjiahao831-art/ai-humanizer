"use client";

import { countWords, countChars } from "@/lib/utils";

type HumanizeMode = "standard" | "aggressive";

interface ResultViewerProps {
  originalText: string;
  humanizedText: string;
  isLoading: boolean;
  mode?: HumanizeMode;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
}

const modeColors = {
  standard: {
    border: "border-emerald-200 dark:border-emerald-900",
    badge: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    icon: "text-emerald-500",
  },
  aggressive: {
    border: "border-rose-200 dark:border-rose-900",
    badge: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    icon: "text-rose-500",
  },
};

export function ResultViewer({
  originalText,
  humanizedText,
  isLoading,
  mode = "standard",
  usage,
}: ResultViewerProps) {
  const colors = modeColors[mode];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className={`w-12 h-12 border-4 ${mode === "aggressive" ? "border-rose-200 dark:border-rose-900" : "border-indigo-200 dark:border-indigo-900"} rounded-full`} />
            <div className={`absolute inset-0 w-12 h-12 border-4 ${mode === "aggressive" ? "border-rose-500" : "border-indigo-500"} border-t-transparent rounded-full animate-spin`} />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {mode === "aggressive" ? "Aggressively humanizing..." : "Humanizing your text..."}
          </p>
          <p className="text-xs text-zinc-400">
            Detecting AI patterns, rewriting, and auditing
          </p>
        </div>
      </div>
    );
  }

  if (!humanizedText && !originalText) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Humanized text will appear here
          </h3>
          <p className="text-xs text-zinc-400">
            Paste your AI-generated text on the left and click Humanize
          </p>
        </div>
      </div>
    );
  }

  const originalWords = countWords(originalText);
  const humanizedWords = countWords(humanizedText);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Humanized result
          </label>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors.badge}`}>
            {mode === "aggressive" ? "Aggressive" : "Standard"}
          </span>
        </div>
        <span className="text-xs text-zinc-400">
          {humanizedWords.toLocaleString()} words · {countChars(humanizedText).toLocaleString()} chars
        </span>
      </div>

      <div className="relative flex-1">
        <div className={`w-full h-full min-h-[300px] p-4 text-sm leading-relaxed bg-white dark:bg-zinc-900 border ${colors.border} rounded-xl overflow-auto prose prose-sm dark:prose-invert`}>
          {humanizedText ? (
            <p className="whitespace-pre-wrap">{humanizedText}</p>
          ) : (
            <p className="text-zinc-400 italic">No result yet. Click Humanize to start.</p>
          )}
        </div>
      </div>

      {/* Stats footer */}
      {usage && humanizedText && (
        <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
          <span>
            Input: {usage.inputTokens.toLocaleString()} tokens
          </span>
          <span>
            Output: {usage.outputTokens.toLocaleString()} tokens
          </span>
          {usage.cacheReadTokens > 0 && (
            <span className="text-emerald-500">
              Cache hit: {usage.cacheReadTokens.toLocaleString()} tokens saved
            </span>
          )}
          <span className="ml-auto">
            Words: {originalWords} → {humanizedWords}
          </span>
        </div>
      )}
    </div>
  );
}
