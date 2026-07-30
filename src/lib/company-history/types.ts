export type CompanyHistoryLocale = "zh" | "en";

export type CompanyHistoryImage = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
};

export type CompanyHistoryPublicItem = {
  id: string;
  displayTime: string;
  title: string | null;
  detailParagraphs: string[];
  imageAsset: CompanyHistoryImage | null;
};
