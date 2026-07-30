export async function verifyTurnstile(token: string): Promise<boolean> {
  if (!token) return false;

  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (process.env.NODE_ENV !== "production" && !secret) {
    console.warn("[TURNSTILE] Development mode: Turnstile verification skipped");
    return true;
  }

  if (!secret) {
    console.error("[TURNSTILE] TURNSTILE_SECRET_KEY not configured");
    return false;
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
      }),
    });

    const data = (await response.json()) as { success: boolean };
    return data.success === true;
  } catch (error) {
    console.error("[TURNSTILE] Verification error:", error);
    return false;
  }
}

export function detectFormTooFast(formStartedAt: number, threshold: number = 2000): boolean {
  const elapsedMs = Date.now() - formStartedAt;
  return elapsedMs < threshold;
}

export function isHoneypotTriggered(website: string | null | undefined): boolean {
  return website ? website.length > 0 : false;
}
