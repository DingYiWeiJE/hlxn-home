const loginFailures = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_FAILURES = 5;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function isLoginRateLimited(ip: string): boolean {
  const record = loginFailures.get(ip);
  if (!record) {
    return false;
  }

  if (Date.now() > record.resetTime) {
    loginFailures.delete(ip);
    return false;
  }

  return record.count >= MAX_FAILURES;
}

export function recordLoginFailure(ip: string): void {
  const record = loginFailures.get(ip);
  const now = Date.now();

  if (!record || now > record.resetTime) {
    loginFailures.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    record.count++;
  }
}

export function clearLoginFailures(ip: string): void {
  loginFailures.delete(ip);
}
