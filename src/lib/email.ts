import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("⚠ RESEND_API_KEY not set — email sending disabled");
    }
    resend = new Resend(apiKey || "re_placeholder");
  }
  return resend;
}

const FROM_EMAIL = "AI Humanizer <noreply@aihumanizer.app>";

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] Verification email for ${to}: token=${token}`);
    console.log(`[DEV] Verify URL: ${process.env.AUTH_URL || "http://localhost:3000"}/api/auth/verify?token=${token}`);
    return true; // In dev mode, pretend it worked
  }

  try {
    const verifyUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/api/auth/verify?token=${token}`;

    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Verify your email — AI Humanizer",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">AI Humanizer</h1>
          <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Verify email
          </a>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
          <p style="color: #9ca3af; font-size: 12px;">
            Link: ${verifyUrl}
          </p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] Password reset email for ${to}: token=${token}`);
    console.log(`[DEV] Reset URL: ${process.env.AUTH_URL || "http://localhost:3000"}/login?reset=${token}`);
    return true;
  }

  try {
    const resetUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/login?reset=${token}`;

    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Reset your password — AI Humanizer",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">AI Humanizer</h1>
          <p>Someone requested a password reset for your account. Click below to reset it:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Reset password
          </a>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            If you didn't request this, you can safely ignore this email. The link expires in 1 hour.
          </p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}
