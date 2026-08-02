import { getRequestConfig } from "next-intl/server";

export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  const lang = locales.includes(locale as Locale)
    ? (locale as Locale)
    : "zh";
  const messages = await import(`./messages/${lang}.json`);
  return {
    locale: lang,
    messages: messages.default,
  };
});
