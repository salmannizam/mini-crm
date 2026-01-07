import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/server-auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AppLayout } from "@/components/layout/AppLayout";
import { ActivityHistory } from "@/components/activity/ActivityHistory";

export default async function ActivityPage() {
  const user = await getCurrentUserServer();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppLayout>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar userRole={user.role} userName={user.name} />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <TopBar title="Activity History" />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-950">
            <ActivityHistory userRole={user.role} />
          </main>
        </div>
      </div>
    </AppLayout>
  );
}
