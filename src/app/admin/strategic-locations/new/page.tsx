import StrategicLocationForm from "@/components/admin/strategic-locations/StrategicLocationForm";

export const metadata = {
  title: "新建战略网点",
};

export default function NewStrategicLocationPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <StrategicLocationForm mode="create" />
    </main>
  );
}
