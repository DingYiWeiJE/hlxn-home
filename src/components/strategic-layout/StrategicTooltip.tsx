import type { StrategicLocation } from "./strategicLayoutData";

export function renderStrategicTooltip(location: StrategicLocation): string {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f2742;min-width:200px;">
      <strong style="display:block;margin-bottom:8px;font-size:14px;">${location.name}</strong>
      <div style="color:#49647d;font-size:12px;line-height:1.6;">
        <div><span style="color:#60758a;">类型：</span>${location.typeLabel}</div>
        <div><span style="color:#60758a;">国家：</span>${location.countryLabel}</div>
        ${location.province ? `<div><span style="color:#60758a;">省份：</span>${location.province}</div>` : ""}
        ${location.city ? `<div><span style="color:#60758a;">城市：</span>${location.city}</div>` : ""}
        ${location.establishment ? `<div><span style="color:#60758a;">成立年份：</span>${location.establishment}</div>` : ""}
      </div>
    </div>
  `;
}
