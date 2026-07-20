import { getRequestConfig } from "next-intl/server";

export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  const lang = (locale || "zh") as Locale;
  const messages = await import(`./messages/${lang}.json`);
  return {
    locale: lang,
    messages: messages.default,
  };
});
