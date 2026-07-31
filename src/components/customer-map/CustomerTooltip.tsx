import type { CustomerLocation } from "./mockData";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderCustomerTooltip(customer: CustomerLocation) {
  const imageHtml = customer.image
    ? `<img src="${escapeHtml(customer.image)}" alt="${escapeHtml(customer.name)}" style="width:180px;height:96px;object-fit:cover;border-radius:6px;margin-bottom:10px;display:block;" />`
    : "";

  return `
    <div style="min-width:180px;color:#0f2742;font-family:Arial,Helvetica,sans-serif;">
      ${imageHtml}
      <div style="font-size:14px;font-weight:700;margin-bottom:6px;">${escapeHtml(customer.name)}</div>
      <div style="font-size:12px;line-height:1.7;color:#49647d;">
        <div>\u56fd\u5bb6\uff1a${escapeHtml(customer.countryLabel)}</div>
        ${customer.city ? `<div>\u57ce\u5e02\uff1a${escapeHtml(customer.city)}</div>` : ""}
      </div>
    </div>
  `;
}

