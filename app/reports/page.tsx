import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/server-auth";
import { UserRole } from "@/lib/constants";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AppLayout } from "@/components/layout/AppLayout";
import { TeamReports } from "@/components/reports/TeamReports";

export default async function ReportsPage() {
  const user = await getCurrentUserServer();

  if (!user) {
    redirect("/login");
  }

  // Only Manager and TL can access reports
  if (![UserRole.MANAGER, UserRole.TEAM_LEADER].includes(user.role as UserRole)) {
    redirect("/dashboard");
  }

  return (
    <AppLayout>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar userRole={user.role} userName={user.name} />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <TopBar title={user.role === UserRole.MANAGER ? "Team Reports" : "User Reports"} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-950">
            <TeamReports userRole={user.role} userId={user._id.toString()} />
          </main>
        </div>
      </div>
    </AppLayout>
  );
}
