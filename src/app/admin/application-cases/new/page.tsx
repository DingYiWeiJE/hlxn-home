import ApplicationCaseForm from "@/components/admin/application-cases/ApplicationCaseForm";

export default function CreateApplicationCasePage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">
          新建应用案例
        </h1>

        <p className="text-sm text-slate-600">
          创建一个新的应用案例
        </p>
      </div>

      <ApplicationCaseForm
        mode="create"
      />
    </div>
  );
}
