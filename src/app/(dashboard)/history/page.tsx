import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const humanizations = await prisma.humanization.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          History
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Your past humanizations
        </p>
      </div>

      {humanizations.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            No humanizations yet
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            Humanize some text to see it here
          </p>
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Go to Humanize →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {humanizations.map((h) => (
            <div
              key={h.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400">
                  {new Date(h.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-xs text-zinc-400">
                  {h.wordCount.toLocaleString()} words · {h.inputTokens.toLocaleString()} tokens
                </span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-2">
                {h.originalText}
              </p>
              <details className="group">
                <summary className="text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer hover:text-indigo-500">
                  Show humanized version
                </summary>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg whitespace-pre-wrap">
                  {h.humanizedText}
                </p>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
