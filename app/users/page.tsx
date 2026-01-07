import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/server-auth";
import { UserRole } from "@/lib/constants";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { UsersList } from "@/components/users/UsersList";

export default async function UsersPage() {
  const user = await getCurrentUserServer();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole={user.role} userName={user.name} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="User Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <UsersList />
        </main>
      </div>
    </div>
  );
}
