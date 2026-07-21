const windowMs = 15 * 60 * 1000;
const maxFailures = 10;

type FailureBucket = {
  count: number;
  resetAt: number;
};

const failures = new Map<string, FailureBucket>();

export function isLoginRateLimited(key: string) {
  const now = Date.now();
  const bucket = failures.get(key);
  if (!bucket || bucket.resetAt <= now) {
    failures.delete(key);
    return false;
  }

  return bucket.count >= maxFailures;
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const bucket = failures.get(key);

  if (!bucket || bucket.resetAt <= now) {
    failures.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
}

export function clearLoginFailures(key: string) {
  failures.delete(key);
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}
