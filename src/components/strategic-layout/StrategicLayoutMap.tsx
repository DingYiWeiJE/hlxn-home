"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as echarts from "echarts";
import type { EChartsOption, EChartsType } from "echarts";
import type { EChartsReactProps } from "echarts-for-react";
import type { ECElementEvent } from "echarts/core";
import { renderStrategicTooltip, type TooltipLabels } from "./StrategicTooltip";
import { loadMapGeoJson, type MapGeoJson, type MapLevel } from "./mapLoader";
import {
  regionMetrics,
  strategicLocations,
  type StrategicLocation,
  type RegionMetric,
} from "./strategicLayoutData";

const ui = {
  loadingMap: "地图加载中...",
  loadingData: "地图数据加载中...",
  loadingError: "地图文件加载失败，请检查 public/maps 下的 GeoJSON 文件。",
  worldTitle: "全球战略布局",
  chinaTitle: "中国战略布局",
  singaporeTitle: "新加坡战略布局",
  intro: `公司以武汉为核心运营与研发总部，统筹全局战略规划、技术创新、市场营销及
全产业链协同，构建“国内全域布局、海外双支点联动”的一体化发展格局。国内以华
中地区武汉为核心牵引，以湖北智造基地为产业支撑，以华北、华南及西部区域总部
为前沿技术科研创新与零碳技术攻坚应用平台，以华东镇江基地为整船集成与落地
保障，形成“研发一制造一集成一应用一服务”的全链条协同体系，实现技术研究、产
业转化与场景应用的完整闭环。海外已设立亚太地区运营与服务中心，同步筹备欧美
地区技术与合规中心，持续助力船舶动力领域的零碳转型和高质量发展`,
  locationCount: "网点数量",
  high: "高",
  low: "低",
  markers: "网点位置",
} as const;

const uiByLocale = {
  zh: ui,
  en: {
    loadingMap: "Loading map...",
    loadingData: "Loading map data...",
    loadingError: "Failed to load map files. Please check GeoJSON files under public/maps.",
    worldTitle: "Global Strategic Layout",
    chinaTitle: "China Strategic Layout",
    singaporeTitle: "Singapore Strategic Layout",
    intro:`With Wuhan serving as the corporate core for headquarters operations and R&D, the Company oversees overall strategic planning, technological innovation, marketing management and cross-industry chain collaboration, establishing an integrated development framework featuring nationwide domestic deployment plus dual overseas pivot coordination.
Domestically, Wuhan in Central China acts as the primary driving hub, supported by Hubei Intelligent Manufacturing Base as the industrial backbone. Regional headquarters in North China, South China and Western China function as frontline platforms for cutting-edge scientific research, technological innovation and the development & deployment of zero-carbon technologies. The Zhenjiang Base in East China undertakes vessel assembly and on-site implementation support. This layout forms a full-spectrum collaborative system covering research & development – manufacturing – assembly – application – services, delivering a closed-loop mechanism that links technological research, industrial commercialization and scenario-based implementation.
On the overseas front, the Company has launched an Asia-Pacific operation and service center, while proceeding with preparations for technology and compliance centers across Europe and the Americas. These global arrangements consistently underpin the zero-carbon transition and high-quality advancement within the marine power industry.`,
    locationCount: "Location count",
    high: "High",
    low: "Low",
    markers: "Locations",
  },
} as const;

const tooltipLabelsByLocale: Record<Locale, TooltipLabels> = {
  zh: {
    type: "类型",
    country: "国家",
    province: "省份",
    city: "城市",
    establishment: "成立年份",
    staff: "员工数",
    staffUnit: "人",
    businessScope: "业务范围",
    scopeSeparator: "、",
  },
  en: {
    type: "Type",
    country: "Country",
    province: "Province",
    city: "City",
    establishment: "Established",
    staff: "Staff Count",
    staffUnit: "people",
    businessScope: "Business Scope",
    scopeSeparator: ", ",
  },
};

const ReactECharts = dynamic<EChartsReactProps>(
  () => import("echarts-for-react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[520px] items-center justify-center text-sm text-[#60758a]">
        {ui.loadingMap}
      </div>
    ),
  },
);

type TooltipParams = {
  name?: string;
  data?: unknown;
};

type TooltipData = {
  location?: StrategicLocation;
  value?: number;
};

function getTooltipData(data: unknown): TooltipData | undefined {
  if (!data || typeof data !== "object" || data instanceof Date || Array.isArray(data)) {
    return undefined;
  }

  return data as TooltipData;
}

const levelMeta: Record<
  MapLevel,
  {
    mapName: string;
    title: string;
    metrics: RegionMetric[];
    center: [number, number];
    zoom: number;
  }
> = {
  world: {
    mapName: "strategic-world",
    title: ui.worldTitle,
    metrics: regionMetrics,
    center: [112, 20],
    zoom: 4.2,
  },
  china: {
    mapName: "strategic-china",
    title: ui.chinaTitle,
    metrics: [],
    center: [113.5, 30.5],
    zoom: 1.2,
  },
  singapore: {
    mapName: "strategic-singapore",
    title: ui.singaporeTitle,
    metrics: [],
    center: [103.8198, 1.3521],
    zoom: 1.25,
  },
};

type Locale = "zh" | "en";

type PublicStrategicLocationsResponse =
  | {
      success: true;
      data: {
        items: StrategicLocation[];
      };
    }
  | {
      success: false;
      error?: {
        message?: string;
      };
    };

function getVisibleLocations(level: MapLevel, locations: StrategicLocation[]) {
  if (level === "world") {
    return locations;
  }

  return locations.filter((location) => {
    if (level === "china") {
      return location.countryCode === "CN" || location.country === "China";
    }

    return location.countryCode === "SG" || location.country === "Singapore";
  });
}

function buildProvinceMetrics(locations: StrategicLocation[]) {
  const counts = new Map<string, number>();

  locations.forEach((location) => {
    const provinceName = location.provinceZh ?? location.province;

    if (!provinceName) {
      return;
    }

    counts.set(provinceName, (counts.get(provinceName) ?? 0) + 1);
  });

  return Array.from(counts, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function getWorldMapName(location: StrategicLocation) {
  if (location.countryCode === "CN" || location.country === "China") {
    return "China";
  }

  if (location.countryCode === "SG" || location.country === "Singapore") {
    return "Singapore";
  }

  if (
    location.countryCode === "US" ||
    location.country === "United States" ||
    location.country === "United States of America"
  ) {
    return "United States of America";
  }

  if (location.countryCode === "JP" || location.country === "Japan") {
    return "Japan";
  }

  if (location.countryCode === "DE" || location.country === "Germany") {
    return "Germany";
  }

  if (location.countryCode === "GB" || location.country === "United Kingdom") {
    return "United Kingdom";
  }

  return location.country;
}

function buildCountryMetrics(locations: StrategicLocation[]) {
  const counts = new Map<string, number>();

  locations.forEach((location) => {
    const countryName = getWorldMapName(location);
    counts.set(countryName, (counts.get(countryName) ?? 0) + 1);
  });

  return Array.from(counts, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function buildScatterData(locations: StrategicLocation[]) {
  return locations.map((location) => ({
    name: location.name,
    value: [location.longitude, location.latitude, 1],
    location,
  }));
}

function getMaxMetricValue(metrics: RegionMetric[]) {
  return Math.max(...metrics.map((item) => item.value), 1);
}

export default function StrategicLayoutMap({ locale = "zh" }: { locale?: string }) {
  const normalizedLocale: Locale = locale === "en" ? "en" : "zh";
  const currentUi = uiByLocale[normalizedLocale];
  const [level, setLevel] = useState<MapLevel>("world");
  const [locations, setLocations] = useState<StrategicLocation[]>([]);
  const [registeredMaps, setRegisteredMaps] = useState<Partial<Record<MapLevel, MapGeoJson>>>({});
  const [mapError, setMapError] = useState<{ level: MapLevel; message: string } | null>(null);
  const chinaProvinceMetrics = useMemo(
    () => buildProvinceMetrics(locations.filter((location) => location.countryCode === "CN" || location.country === "China")),
    [locations],
  );
  const countryMetrics = useMemo(() => buildCountryMetrics(locations), [locations]);

  useEffect(() => {
    let active = true;

    console.log('🔄 Starting fetch strategic locations with locale:', normalizedLocale);

    fetch(`/api/strategic-locations?locale=${normalizedLocale}`, {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        console.log('📡 Response status:', response.status, response.ok);
        const result = (await response.json()) as PublicStrategicLocationsResponse;

        console.log('📦 API Response:', result);

        if (!active || !response.ok || !result.success || !result.data || result.data.items.length === 0) {
          console.log('⚠️ Skipping update - active:', active, 'ok:', response.ok, 'success:', result.success, 'items count:', result.success ? result.data?.items?.length : 'N/A');
          return;
        }

        console.log('%c Ding 🚀🚀🚀', 'color: white; background: linear-gradient(135deg, #00c853, #64dd17); padding: 6px 12px; border-radius: 8px; font-size: 14px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.3);',
          result
        );


        setLocations(result.data.items);
      })
      .catch((error) => {
        console.error('❌ Fetch strategic locations failed:', error);
        if (active) {
          setLocations([]);
        }
      });

    return () => {
      active = false;
    };
  }, [normalizedLocale]);

  useEffect(() => {
    let active = true;
    const meta = levelMeta[level];

    loadMapGeoJson(level)
      .then((data) => {
        if (!active) {
          return;
        }

        echarts.registerMap(meta.mapName, data as Parameters<typeof echarts.registerMap>[1]);
        setRegisteredMaps((current) => ({ ...current, [level]: data }));
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setMapError({
          level,
          message: error instanceof Error ? error.message : ui.loadingError,
        });
      });

    return () => {
      active = false;
    };
  }, [level]);

  const option = useMemo<EChartsOption>(() => {
    const meta = levelMeta[level];
    const visibleLocations = getVisibleLocations(level, locations);
    const mapMetrics = level === "china" ? chinaProvinceMetrics : countryMetrics;
    const maxValue = getMaxMetricValue(mapMetrics);
    const title =
      level === "china"
        ? currentUi.chinaTitle
        : level === "singapore"
          ? currentUi.singaporeTitle
          : currentUi.worldTitle;
    const tooltipLabels = tooltipLabelsByLocale[normalizedLocale];

    return {
      backgroundColor: "transparent",
      animationDurationUpdate: 450,
      tooltip: {
        trigger: "item",
        borderWidth: 0,
        backgroundColor: "rgba(255,255,255,0.96)",
        confine: true,
        alwaysShowContent: false,
        transitionDuration: 0.2,
        padding: [12, 12, 12, 12],
        extraCssText:
          "box-shadow:0 18px 42px rgba(15,39,66,0.16);border-radius:8px;max-height:500px;overflow-y:auto;",
        formatter: (params) => {
          const itemParams = Array.isArray(params) ? params[0] : (params as TooltipParams);
          const data = getTooltipData(itemParams.data);

          if (data?.location) {
            return renderStrategicTooltip(data.location, tooltipLabels);
          }

          const value = typeof data?.value === "number" ? data.value : 0;
          return `<div style="font-family:Arial,Helvetica,sans-serif;color:#0f2742;"><strong>${itemParams.name ?? ""}</strong><br/><span style="color:#49647d;font-size:12px;">${currentUi.locationCount}：${value}</span></div>`;
        },
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 18,
        bottom: 22,
        itemWidth: 12,
        itemHeight: 92,
        text: [currentUi.high, currentUi.low],
        calculable: false,
        show: level === "world",
        seriesIndex: 0,
        inRange: {
          color: ["#dcecf7", "#7fb6e1", "#2365c4", "#0f3b7a"],
        },
        textStyle: {
          color: "#60758a",
          fontSize: 11,
        },
      },
      geo: {
        map: meta.mapName,
        roam: true,
        center: meta.center,
        zoom: meta.zoom,
        scaleLimit: {
          min: level === "world" ? 3 : 0.8,
          max: 12,
        },
        itemStyle: {
          areaColor: "#eef6fb",
          borderColor: "#ffffff",
          borderWidth: 1,
        },
        emphasis: {
          label: {
            color: "#0f2742",
            fontWeight: 700,
          },
          itemStyle: {
            areaColor: "#9fd1f1",
          },
        },
        select: {
          disabled: true,
        },
      },
      series: [
        {
          name: title,
          type: "map",
          geoIndex: 0,
          map: meta.mapName,
          data: mapMetrics,
          itemStyle: {
            areaColor: "#eef6fb",
            borderColor: "#ffffff",
            borderWidth: 1,
          },
          emphasis: {
            label: {
              color: "#0f2742",
              fontWeight: 700,
            },
            itemStyle: {
              areaColor: "#9fd1f1",
            },
          },
        },
        {
          name: currentUi.markers,
          type: "scatter",
          coordinateSystem: "geo",
          data: buildScatterData(visibleLocations),
          symbolSize: 13,
          itemStyle: {
            color: "#06b6d4",
            borderColor: "#ffffff",
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: "rgba(6,182,212,0.48)",
          },
          emphasis: {
            scale: 1.35,
            itemStyle: {
              color: "#0891b2",
            },
          },
          zlevel: 2,
        },
      ],
    };
  }, [chinaProvinceMetrics, countryMetrics, currentUi, level, locations, normalizedLocale]);

  const handleMapClick = useCallback((params: ECElementEvent) => {
    if (params.seriesType === "scatter") {
      return;
    }

    if (level === "world") {
      if (params.name === "China") {
        setLevel("china");
      }

      if (params.name === "Singapore") {
        setLevel("singapore");
      }
    }
  }, [level]);

  const onEvents = useMemo(
    () => ({
      click: handleMapClick,
    }),
    [handleMapClick],
  );

  const handleChartReady = useCallback((chart: EChartsType) => {
    chart.getZr().on("click", (event: { target?: unknown }) => {
      if (!event.target) {
        setLevel((currentLevel) => (currentLevel === "world" ? currentLevel : "world"));
      }
    });
  }, []);

  return (
    <section className="bg-[#f8fcff] py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="mt-3 text-2xl font-bold tracking-wide text-[#2365c4] md:text-3xl lg:text-4xl">
            {currentUi.worldTitle}
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#52677f] md:text-base">
            {normalizedLocale === "zh" ? <>
            </> : currentUi.intro}
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-lg border border-[#d9ebf8] bg-[#f8fcff] shadow-[0_24px_70px_rgba(20,73,128,0.10)]">
          <div className="relative h-[600px] min-h-[520px] w-full">
            {mapError?.level === level ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#b42318]">
                {currentUi.loadingError}
              </div>
            ) : !registeredMaps[level] ? (
              <div className="flex h-full items-center justify-center text-sm text-[#60758a]">
                {currentUi.loadingData}
              </div>
            ) : (
              <ReactECharts
                echarts={echarts}
                option={option}
                onEvents={onEvents}
                onChartReady={handleChartReady}
                notMerge
                lazyUpdate
                style={{ width: "100%", height: "100%" }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
