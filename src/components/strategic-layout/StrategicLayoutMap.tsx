"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as echarts from "echarts";
import type { EChartsOption, EChartsType } from "echarts";
import type { EChartsReactProps } from "echarts-for-react";
import type { ECElementEvent } from "echarts/core";
import { renderStrategicTooltip } from "./StrategicTooltip";
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
  intro: "基于 Mock 数据展示全球分公司、营销分部等网点分布，支持点击中国或新加坡查看详细网点信息。",
  locationCount: "网点数量",
  high: "高",
  low: "低",
  markers: "网点位置",
} as const;

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

function getVisibleLocations(level: MapLevel) {
  if (level === "world") {
    return strategicLocations;
  }

  return strategicLocations.filter((location) => {
    if (level === "china") {
      return location.country === "China";
    }

    return location.country === "Singapore";
  });
}

function buildProvinceMetrics(locations: StrategicLocation[]) {
  const counts = new Map<string, number>();

  locations.forEach((location) => {
    if (!location.province) {
      return;
    }

    counts.set(location.province, (counts.get(location.province) ?? 0) + 1);
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

export default function StrategicLayoutMap() {
  const [level, setLevel] = useState<MapLevel>("world");
  const [registeredMaps, setRegisteredMaps] = useState<Partial<Record<MapLevel, MapGeoJson>>>({});
  const [mapError, setMapError] = useState<{ level: MapLevel; message: string } | null>(null);
  const chinaProvinceMetrics = useMemo(
    () => buildProvinceMetrics(strategicLocations.filter((location) => location.country === "China")),
    [],
  );

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
    const locations = getVisibleLocations(level);
    const mapMetrics = level === "china" ? chinaProvinceMetrics : regionMetrics;
    const maxValue = getMaxMetricValue(mapMetrics);

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
            return renderStrategicTooltip(data.location);
          }

          const value = typeof data?.value === "number" ? data.value : 0;
          return `<div style="font-family:Arial,Helvetica,sans-serif;color:#0f2742;"><strong>${itemParams.name ?? ""}</strong><br/><span style="color:#49647d;font-size:12px;">${ui.locationCount}：${value}</span></div>`;
        },
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 18,
        bottom: 22,
        itemWidth: 12,
        itemHeight: 92,
        text: [ui.high, ui.low],
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
          name: meta.title,
          type: "map",
          geoIndex: 0,
          map: meta.mapName,
          data: level === "china" ? chinaProvinceMetrics : meta.metrics,
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
          name: ui.markers,
          type: "scatter",
          coordinateSystem: "geo",
          data: buildScatterData(locations),
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
  }, [chinaProvinceMetrics, level]);

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
            {ui.worldTitle}
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#52677f] md:text-base">
            公司以武汉为核心运营与研发总部，统筹全局战略规划、技术创新、市场营销及
全产业链协同，构建“国内全域布局、海外双支点联动”的一体化发展格局。国内以华
中地区武汉为核心牵引，以湖北智造基地为产业支撑，以华北、华南及西部区域总部
为前沿技术科研创新与零碳技术攻坚应用平台，以华东镇江基地为整船集成与落地
保障，形成“研发一制造一集成一应用一服务”的全链条协同体系，实现技术研究、产
业转化与场景应用的完整闭环。海外已设立亚太地区运营与服务中心，同步筹备欧美
地区技术与合规中心，持续助力船舶动力领域的零碳转型和高质量发展
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-lg border border-[#d9ebf8] bg-[#f8fcff] shadow-[0_24px_70px_rgba(20,73,128,0.10)]">
          <div className="relative h-[600px] min-h-[520px] w-full">
            {mapError?.level === level ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#b42318]">
                {ui.loadingError}
              </div>
            ) : !registeredMaps[level] ? (
              <div className="flex h-full items-center justify-center text-sm text-[#60758a]">
                {ui.loadingData}
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
