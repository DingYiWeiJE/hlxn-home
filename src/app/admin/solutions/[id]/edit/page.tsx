import { notFound } from "next/navigation";

import SolutionForm, {
  type SolutionFormInitialData,
} from "@/components/admin/solutions/SolutionForm";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditSolutionPage({ params }: PageProps) {
  await requireAdminActor();

  const { id } = await params;

  const solution = await prisma.solution.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: {
      id: true,
      locale: true,
      title: true,
      subtitle: true,
      slug: true,
      status: true,
      sortOrder: true,
      translationKey: true,
      categoryId: true,
      summaryParagraphs: true,
      highlights: true,
      workingPrincipleParagraphs: true,
      workingPrincipleBackgroundAssetId: true,
      coverImageAssetId: true,
      systemCompositionParagraphs: true,
      publishedAt: true,
      coverImageAsset: {
        select: {
          id: true,
          url: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          width: true,
          height: true,
          alt: true,
        },
      },
      workingPrincipleBackgroundAsset: {
        select: {
          id: true,
          url: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          width: true,
          height: true,
          alt: true,
        },
      },
      usageScenarios: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          title: true,
          detailParagraphs: true,
          sortOrder: true,
          imageAssetId: true,
          imageAsset: {
            select: {
              id: true,
              url: true,
              filename: true,
              originalName: true,
              mimeType: true,
              size: true,
              width: true,
              height: true,
              alt: true,
            },
          },
        },
      },
      customerValues: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          title: true,
          detailParagraphs: true,
          sortOrder: true,
          imageAssetId: true,
          imageAsset: {
            select: {
              id: true,
              url: true,
              filename: true,
              originalName: true,
              mimeType: true,
              size: true,
              width: true,
              height: true,
              alt: true,
            },
          },
        },
      },
    },
  });

  if (!solution) {
    notFound();
  }

  const initialData: SolutionFormInitialData = {
    ...solution,
    publishedAt: solution.publishedAt?.toISOString() ?? null,
    detailUrl: `/${solution.locale}/solutions/${solution.slug}`,
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <SolutionForm mode="edit" initialData={initialData} />
    </main>
  );
}
