import CompanyHistoryForm from "@/components/admin/company-history/CompanyHistoryForm";

export default function NewCompanyHistoryPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Company History
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">新建公司发展历程</h1>
        <p className="mt-1 text-sm text-slate-500">
          中文和英文内容分别维护，保存后立即在对应 About 页面展示。
        </p>
      </div>

      <CompanyHistoryForm mode="create" />
    </main>
  );
}
