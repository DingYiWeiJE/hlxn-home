import type {
  StrategicLocation,
  StrategicLocationType,
} from "@prisma/client";

type Locale = "zh" | "en";

const typeLabels: Record<
  Locale,
  Record<StrategicLocationType, string>
> = {
  zh: {
    HEADQUARTERS: "总部",
    BRANCH: "分公司",
    MARKETING: "营销分部",
    SERVICE: "服务中心",
  },
  en: {
    HEADQUARTERS: "Headquarters",
    BRANCH: "Branch",
    MARKETING: "Marketing Office",
    SERVICE: "Service Center",
  },
};

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export function serializePublicStrategicLocation(
  location: StrategicLocation,
  locale: Locale,
) {
  const isEnglish = locale === "en";
  const type = location.type.toLowerCase();

  return {
    id: location.id,
    code: location.code,
    name: isEnglish ? location.nameEn : location.nameZh,
    type,
    typeLabel: typeLabels[locale][location.type],
    country: location.countryNameEn,
    countryCode: location.countryCode,
    countryLabel: isEnglish ? location.countryNameEn : location.countryNameZh,
    province: isEnglish
      ? location.provinceNameEn
      : location.provinceNameZh,
    provinceZh: location.provinceNameZh,
    city: isEnglish ? location.cityNameEn : location.cityNameZh,
    longitude: Number(location.longitude),
    latitude: Number(location.latitude),
    establishment: location.establishment,
    description: isEnglish ? location.descriptionEn : location.descriptionZh,
    image: location.imageUrl,
    staff: location.staff,
    businessScope: normalizeStringArray(
      isEnglish ? location.businessScopeEn : location.businessScopeZh,
    ),
    sortOrder: location.sortOrder,
  };
}
