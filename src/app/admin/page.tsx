import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth/session";

export default async function AdminIndex() {
  const session = await getAdminSession();
  redirect(session ? "/admin/news" : "/admin/login");
}
