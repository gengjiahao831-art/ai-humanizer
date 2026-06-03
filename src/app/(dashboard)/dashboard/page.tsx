import { HumanizeEditor } from "@/components/humanize/humanize-editor";

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Humanize AI Text
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Paste AI-generated text and get natural, human-sounding output.
        </p>
      </div>
      <HumanizeEditor />
    </div>
  );
}
