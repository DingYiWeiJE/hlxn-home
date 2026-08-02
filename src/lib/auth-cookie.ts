function splitConfiguredOrigins(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isHttpsOrigin(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function shouldUseSecureCookies() {
  const configuredOrigins = [
    ...splitConfiguredOrigins(process.env.APP_ORIGIN),
    ...splitConfiguredOrigins(process.env.NEXT_PUBLIC_SITE_URL),
    ...splitConfiguredOrigins(process.env.NEXT_PUBLIC_API_BASE_URL),
    ...splitConfiguredOrigins(process.env.NEXT_PUBLIC_API_URL),
  ];

  if (configuredOrigins.length > 0) {
    return configuredOrigins.every(isHttpsOrigin);
  }

  return process.env.NODE_ENV === "production";
}
