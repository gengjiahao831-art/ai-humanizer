import prisma from "./prisma";

// Plan limits (MVP: single free tier)
const PLAN_LIMITS = {
  free: {
    wordsPerMonth: 5000,
    requestsPerDay: 20,
    maxTextLength: 2000,
  },
  pro: {
    wordsPerMonth: 100000,
    requestsPerDay: 200,
    maxTextLength: 10000,
  },
};

type PlanName = keyof typeof PLAN_LIMITS;

function getPlanName(_userId: string): PlanName {
  // MVP: all users are on the free tier
  // v2: check subscription table
  return "free";
}

function getPeriodStart(type: "monthly" | "daily"): Date {
  const now = new Date();
  if (type === "monthly") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getPeriodEnd(start: Date, type: "monthly" | "daily"): Date {
  const end = new Date(start);
  if (type === "monthly") {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setDate(end.getDate() + 1);
  }
  return end;
}

export async function checkQuota(
  userId: string,
  wordCount: number
): Promise<{ allowed: boolean; reason?: string }> {
  const plan = getPlanName(userId);
  const limits = PLAN_LIMITS[plan];

  const monthStart = getPeriodStart("monthly");
  const todayStart = getPeriodStart("daily");

  // Get or create usage records
  const [monthlyUsage, dailyUsage] = await Promise.all([
    prisma.quotaUsage.upsert({
      where: {
        userId_periodType_periodStart: {
          userId,
          periodType: "monthly",
          periodStart: monthStart,
        },
      },
      create: {
        userId,
        periodType: "monthly",
        periodStart: monthStart,
        periodEnd: getPeriodEnd(monthStart, "monthly"),
      },
      update: {},
    }),
    prisma.quotaUsage.upsert({
      where: {
        userId_periodType_periodStart: {
          userId,
          periodType: "daily",
          periodStart: todayStart,
        },
      },
      create: {
        userId,
        periodType: "daily",
        periodStart: todayStart,
        periodEnd: getPeriodEnd(todayStart, "daily"),
      },
      update: {},
    }),
  ]);

  // Check text length
  if (wordCount > limits.maxTextLength) {
    return {
      allowed: false,
      reason: `Text too long. Maximum ${limits.maxTextLength.toLocaleString()} words per request.`,
    };
  }

  // Check monthly word quota
  if (monthlyUsage.wordsUsed + wordCount > limits.wordsPerMonth) {
    return {
      allowed: false,
      reason: `Monthly word limit (${limits.wordsPerMonth.toLocaleString()}) would be exceeded.`,
    };
  }

  // Check daily request quota
  if (dailyUsage.requestsUsed + 1 > limits.requestsPerDay) {
    return {
      allowed: false,
      reason: `Daily request limit (${limits.requestsPerDay}) reached. Try again tomorrow.`,
    };
  }

  return { allowed: true };
}

export async function consumeQuota(
  userId: string,
  wordCount: number
): Promise<void> {
  const monthStart = getPeriodStart("monthly");
  const todayStart = getPeriodStart("daily");

  await Promise.all([
    prisma.quotaUsage.updateMany({
      where: { userId, periodType: "monthly", periodStart: monthStart },
      data: {
        wordsUsed: { increment: wordCount },
        requestsUsed: { increment: 1 },
      },
    }),
    prisma.quotaUsage.updateMany({
      where: { userId, periodType: "daily", periodStart: todayStart },
      data: {
        wordsUsed: { increment: wordCount },
        requestsUsed: { increment: 1 },
      },
    }),
  ]);
}
