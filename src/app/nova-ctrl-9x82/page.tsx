import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default async function HiddenAdminLoginPage() {
  if (await isAdmin()) {
    redirect("/nova-ctrl-9x82/dashboard");
  }
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <LoginForm />
    </main>
  );
}
