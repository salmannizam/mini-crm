import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/server-auth";
import { UserRole } from "@/lib/constants";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { UsersList } from "@/components/users/UsersList";
import { AppLayout } from "@/components/layout/AppLayout";

export default async function UsersPage() {
  const user = await getCurrentUserServer();

  if (!user) {
    redirect("/login");
  }

  // Admin, Manager, and TL can view users (but only Admin can create)
  if (![UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEADER].includes(user.role as UserRole)) {
    redirect("/dashboard");
  }

  return (
    <AppLayout>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar userRole={user.role} userName={user.name} />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <TopBar title="User Management" />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-950">
            <UsersList />
          </main>
        </div>
      </div>
    </AppLayout>
  );
}
