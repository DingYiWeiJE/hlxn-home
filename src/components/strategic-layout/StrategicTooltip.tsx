import type { StrategicLocation } from "./strategicLayoutData";

export type TooltipLabels = {
  type: string;
  country: string;
  province: string;
  city: string;
  establishment: string;
  staff: string;
  staffUnit: string;
  businessScope: string;
  scopeSeparator: string;
};

export function renderStrategicTooltip(
  location: StrategicLocation,
  labels: TooltipLabels
): string {
  const imageHtml = location.image
    ? `<img src="${location.image}" alt="${location.name}" style="width:100%;height:120px;object-fit:cover;border-radius:4px;margin-bottom:8px;" />`
    : "";

  const businessScopeHtml = location.businessScope
    ? `<div style="margin-top:8px;"><span style="color:#60758a;">${labels.businessScope}：</span><span>${location.businessScope.join(labels.scopeSeparator)}</span></div>`
    : "";

  const staffHtml = location.staff
    ? `<div style="margin-top:4px;"><span style="color:#60758a;">${labels.staff}：</span><span>${location.staff}${labels.staffUnit}</span></div>`
    : "";

  return `
    <div style="font-family:OPPOSans2_En_design-Regular, 微软雅黑, Arial, PingFangSC-Light, 'Helvetica Neue', Helvetica, 'Microsoft Yahei', 'Hiragino Sans GB', tahoma, sans-serif;color:#0f2742;min-width:280px;max-width:320px;">
      ${imageHtml}
      <strong style="display:block;margin-bottom:8px;font-size:14px;">${location.name}</strong>
      <div style="color:#49647d;font-size:12px;line-height:1.8;">
        <div><span style="color:#60758a;">${labels.type}：</span>${location.typeLabel}</div>
        <div><span style="color:#60758a;">${labels.country}：</span>${location.countryLabel}</div>
        ${location.province ? `<div><span style="color:#60758a;">${labels.province}：</span>${location.province}</div>` : ""}
        ${location.city ? `<div><span style="color:#60758a;">${labels.city}：</span>${location.city}</div>` : ""}
        ${location.establishment ? `<div><span style="color:#60758a;">${labels.establishment}：</span>${location.establishment}</div>` : ""}
        ${staffHtml}
        ${businessScopeHtml}
        ${location.description ? `<div style="margin-top:8px;color:#52677f;font-size:11px;line-height:1.6;border-top:1px solid #dde8f0;padding-top:8px;">${location.description}</div>` : ""}
      </div>
    </div>
  `;
}

