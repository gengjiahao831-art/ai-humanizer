import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=missing-token", request.url)
    );
  }

  try {
    // Find and validate the token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      // Clean expired token
      if (verificationToken) {
        await prisma.verificationToken.delete({ where: { token } });
      }
      return NextResponse.redirect(
        new URL("/login?error=invalid-token", request.url)
      );
    }

    // Verify the user
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the token
    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.redirect(
      new URL("/login?verified=true", request.url)
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(
      new URL("/login?error=verification-failed", request.url)
    );
  }
}
