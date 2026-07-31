export type GeoJsonFeature = {
  type: "Feature";
  properties: {
    name?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};

export type MapGeoJson = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

export type MapLevel = "world" | "china" | "singapore";

const mapPaths: Record<MapLevel, string> = {
  world: "/maps/world.json",
  china: "/maps/china.json",
  singapore: "/maps/singapore.json",
};

function getFeatureName(properties: GeoJsonFeature["properties"]) {
  const candidates = [
    properties.name,
    properties.NAME,
    properties.ADMIN,
    properties.COUNTRY,
    properties.NAME_EN,
  ];

  return candidates.find((value): value is string => typeof value === "string" && value.length > 0);
}

function normalizeGeoJson(data: MapGeoJson): MapGeoJson {
  return {
    ...data,
    features: data.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        name: getFeatureName(feature.properties) ?? "",
      },
    })),
  };
}

export async function loadMapGeoJson(level: MapLevel): Promise<MapGeoJson> {
  const response = await fetch(mapPaths[level], { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load map file: ${mapPaths[level]}`);
  }

  return normalizeGeoJson((await response.json()) as MapGeoJson);
}
