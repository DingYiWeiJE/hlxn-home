import SolutionForm from "@/components/admin/solutions/SolutionForm";

export default function NewSolutionPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <SolutionForm mode="create" />
    </main>
  );
}
