"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NewsEditor from "./NewsEditor";
import type { TiptapNode } from "@/lib/news/tiptap";

type NewsFormState = {
  title: string;
  slug: string;
  locale: "zh" | "en";
  summary: string;
  coverImage: string;
  coverImageAlt: string;
  authorName: string;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  publishedAt: string;
  content: TiptapNode;
};

type Props = {
  mode: "create" | "edit";
  id?: string;
  initialValue?: Partial<NewsFormState>;
};

const emptyContent: TiptapNode = { type: "doc", content: [] };

export default function NewsForm({ mode, id, initialValue }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<NewsFormState>({
    title: initialValue?.title ?? "",
    slug: initialValue?.slug ?? "",
    locale: (initialValue?.locale ?? "zh") as "zh" | "en",
    summary: initialValue?.summary ?? "",
    coverImage: initialValue?.coverImage ?? "",
    coverImageAlt: initialValue?.coverImageAlt ?? "",
    authorName: initialValue?.authorName ?? "",
    status: initialValue?.status ?? "DRAFT",
    isFeatured: initialValue?.isFeatured ?? false,
    publishedAt: initialValue?.publishedAt ?? "",
    content: initialValue?.content ?? emptyContent,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const dirty = useMemo(() => true, []);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  async function submit(action: "save" | "publish") {
    setSaving(true);
    setError("");
    setFieldErrors({});

    const payload = {
      ...form,
      status: action === "publish" ? "PUBLISHED" : form.status,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
      slug: form.slug || undefined,
      summary: form.summary || null,
      coverImage: form.coverImage || null,
      coverImageAlt: form.coverImageAlt || null,
      authorName: form.authorName || null,
    };

    const response = await fetch(mode === "create" ? "/api/news" : `/api/news/${id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      success: boolean;
      error?: { message: string; fieldErrors?: Record<string, string[]> };
      data?: { id: string };
    };

    setSaving(false);
    if (!response.ok || !data.success) {
      setError(data.error?.message ?? "保存失败");
      setFieldErrors(data.error?.fieldErrors ?? {});
      return;
    }

    router.replace("/admin/news");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="语言" error={fieldErrors.locale?.[0]}>
          <select value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value as "zh" | "en" })} className="w-full rounded-md border border-slate-300 px-3 py-2">
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </Field>
        <Field label="标题" error={fieldErrors.title?.[0]}>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </Field>
        <Field label="Slug" error={fieldErrors.slug?.[0]}>
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </Field>
        <Field label="摘要" error={fieldErrors.summary?.[0]} className="md:col-span-2">
          <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" />
        </Field>
        <Field label="封面图 URL" error={fieldErrors.coverImage?.[0]}>
          <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </Field>
        <Field label="封面图说明" error={fieldErrors.coverImageAlt?.[0]}>
          <input value={form.coverImageAlt} onChange={(e) => setForm({ ...form, coverImageAlt: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </Field>
        <Field label="作者" error={fieldErrors.authorName?.[0]}>
          <input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </Field>
        <Field label="发布时间" error={fieldErrors.publishedAt?.[0]}>
          <input type="datetime-local" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
          推荐
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.status === "PUBLISHED"} onChange={(e) => setForm({ ...form, status: e.target.checked ? "PUBLISHED" : "DRAFT" })} />
          发布
        </label>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">正文</p>
        <NewsEditor value={form.content} onChange={(content) => setForm({ ...form, content })} />
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={saving} onClick={() => submit("save")} className="rounded-md border border-slate-300 px-4 py-2 disabled:opacity-60">
          保存草稿
        </button>
        <button type="button" disabled={saving} onClick={() => submit("publish")} className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-60">
          {saving ? "保存中..." : "发布"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
