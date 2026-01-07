import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/server-auth";
import { UserRole } from "@/lib/constants";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { LeadsList } from "@/components/leads/LeadsList";

export default async function LeadsPage() {
  const user = await getCurrentUserServer();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar userRole={user.role} userName={user.name} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Leads">
          <a
            href="/leads/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-sm hover:shadow-md transition-all"
          >
            New Lead
          </a>
        </TopBar>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
          <LeadsList userRole={user.role} userId={user._id.toString()} />
        </main>
      </div>
    </div>
  );
}
