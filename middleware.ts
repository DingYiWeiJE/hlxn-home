import createMiddleware from "next-intl/middleware";

const locales = ["zh", "en"] as const;

export default createMiddleware({
  locales: locales,
  defaultLocale: "zh",
  localePrefix: "always",
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
