import { getRequestConfig } from "next-intl/server";

export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  const messages = await import(`../messages/${locale}.json`);
  return {
    locale: locale as string,
    messages: messages.default,
  };
});
