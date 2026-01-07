import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/server-auth";
import { UserRole } from "@/lib/constants";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default async function DashboardPage() {
  const user = await getCurrentUserServer();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole={user.role} userName={user.name} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Dashboard" />
        <main className="flex-1 overflow-y-auto p-6">
          {user.role === UserRole.ADMIN ? (
            <AdminDashboard />
          ) : (
            <UserDashboard userId={user._id.toString()} />
          )}
        </main>
      </div>
    </div>
  );
}
