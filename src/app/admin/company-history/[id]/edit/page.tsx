import { notFound } from "next/navigation";

import CompanyHistoryForm from "@/components/admin/company-history/CompanyHistoryForm";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { formatDateInput } from "@/lib/company-history/date";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCompanyHistoryPage({ params }: Props) {
  await requireAdminActor();

  const { id } = await params;

  const event = await prisma.companyHistoryEvent.findUnique({
    where: { id },
    select: {
      id: true,
      time: true,
      content: true,
      sortOrder: true,
      imageAssetId: true,
      imageAsset: {
        select: {
          id: true,
          url: true,
          width: true,
          height: true,
          alt: true,
        },
      },
      historyYear: {
        select: {
          locale: true,
          year: true,
          sortDate: true,
          sortOrder: true,
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Company History
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">编辑公司发展历程</h1>
        <p className="mt-1 text-sm text-slate-500">
          可修改年份、事件时间、内容、排序时间、排序值和图片。
        </p>
      </div>

      <CompanyHistoryForm
        mode="edit"
        initialData={{
          id: event.id,
          time: event.time,
          content: event.content,
          sortOrder: event.sortOrder,
          imageAssetId: event.imageAssetId,
          imageAsset: event.imageAsset,
          historyYear: {
            locale: event.historyYear.locale as "zh" | "en",
            year: event.historyYear.year,
            sortDate: formatDateInput(event.historyYear.sortDate),
            sortOrder: event.historyYear.sortOrder,
          },
        }}
      />
    </main>
  );
}
