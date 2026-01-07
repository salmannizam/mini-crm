import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/server-auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { LeadDetail } from "@/components/leads/LeadDetail";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUserServer();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar userRole={user.role} userName={user.name} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Lead Details" />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
          <LeadDetail leadId={id} userRole={user.role} userId={user._id.toString()} />
        </main>
      </div>
    </div>
  );
}
