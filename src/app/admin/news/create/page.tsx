"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NewsForm from "@/components/admin/NewsForm";
import { emptyTiptapDocument } from "@/lib/news/tiptap";

export default function AdminCreateNewsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/session", {
          credentials: "include",
        });
        const result = (await response.json()) as { success: boolean; data: { authenticated: boolean } };
        const authenticated = result.data?.authenticated ?? false;

        if (!authenticated) {
          router.replace("/admin/login");
        } else {
          setIsAuthorized(true);
        }
      } catch {
        router.replace("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (isLoading) return null;
  if (!isAuthorized) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">创建新闻</h1>
      <NewsForm mode="create" initialValue={{ content: emptyTiptapDocument }} />
    </main>
  );
}
