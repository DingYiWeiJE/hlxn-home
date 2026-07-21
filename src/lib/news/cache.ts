import { revalidatePath } from "next/cache";

export function revalidateNewsCache(input: { oldSlug?: string | null; newSlug?: string | null } = {}) {
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/zh");
  revalidatePath("/en");
  revalidatePath("/zh/news");
  revalidatePath("/en/news");
  revalidatePath("/admin/news");

  for (const slug of [input.oldSlug, input.newSlug]) {
    if (slug) {
      revalidatePath(`/zh/news/${slug}`);
      revalidatePath(`/en/news/${slug}`);
    }
  }
}
