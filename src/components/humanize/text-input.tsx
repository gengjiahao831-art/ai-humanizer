"use client";

import { countWords, countChars } from "@/lib/utils";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  maxChars?: number;
}

export function TextInput({
  value,
  onChange,
  disabled,
  maxChars = 10000,
}: TextInputProps) {
  const wordCount = countWords(value);
  const charCount = countChars(value);
  const charPercentage = Math.min((charCount / maxChars) * 100, 100);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Paste AI-generated text
        </label>
        <span className="text-xs text-zinc-400">
          {wordCount.toLocaleString()} words · {charCount.toLocaleString()} / {maxChars.toLocaleString()} chars
        </span>
      </div>

      <div className="relative flex-1">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Paste your AI-generated text here...&#10;&#10;For example: a ChatGPT essay, an AI-written email, or content that sounds too robotic."
          maxLength={maxChars}
          className="w-full h-full min-h-[300px] p-4 text-sm leading-relaxed bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 placeholder:text-zinc-400 transition-colors font-mono"
          spellCheck={false}
        />
      </div>

      {/* Character progress bar */}
      <div className="mt-2 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            charPercentage > 90
              ? "bg-red-500"
              : charPercentage > 70
              ? "bg-amber-500"
              : "bg-indigo-500"
          }`}
          style={{ width: `${charPercentage}%` }}
        />
      </div>
    </div>
  );
}
