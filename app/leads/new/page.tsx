import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/server-auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { CreateLeadForm } from "@/components/leads/CreateLeadForm";
import { AppLayout } from "@/components/layout/AppLayout";

export default async function NewLeadPage() {
  const user = await getCurrentUserServer();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppLayout>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar userRole={user.role} userName={user.name} />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <TopBar title="Create New Lead" />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-950">
            <CreateLeadForm userRole={user.role} userId={user._id.toString()} />
          </main>
        </div>
      </div>
    </AppLayout>
  );
}
