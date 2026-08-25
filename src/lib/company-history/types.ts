export type CompanyHistoryLocale = "zh" | "en";

export type CompanyHistoryImage = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
};

export type CompanyHistoryEvent = {
  time: string;
  content: string;
  image: string | null;
};

export type CompanyHistoryPublicItem = {
  year: number;
  events: CompanyHistoryEvent[];
};
