"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { LeadStatus, UserRole, LeadSource } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";

interface CreateLeadFormProps {
  userRole: string;
  userId: string;
}

export function CreateLeadForm({ userRole, userId }: CreateLeadFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userRole === UserRole.ADMIN) {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());

      if (userRole !== UserRole.ADMIN) {
        data.assignedUser = userId;
      } else {
        // Validate assignedUser for admin users
        const assignedUser = data.assignedUser as string;
        if (!assignedUser || assignedUser === "" || !/^[0-9a-fA-F]{24}$/.test(assignedUser)) {
          addToast({
            title: "Error",
            description: "Please select a valid user to assign this lead to",
            variant: "error",
          });
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        addToast({ title: "Success", description: "Lead created successfully", variant: "success" });
        router.push(`/leads/${result.lead._id}`);
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to create lead" }));
        addToast({ title: "Error", description: error.error || "Failed to create lead", variant: "error" });
        setLoading(false);
      }
    } catch (error) {
      console.error("Error creating lead:", error);
      addToast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "error",
      });
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Create New Lead</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" name="phone" required />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={LeadStatus.NEW}>
                {Object.values(LeadStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address *</Label>
            <Textarea id="address" name="address" required />
          </div>
          {userRole === UserRole.ADMIN && (
            <div>
              <Label htmlFor="assignedUser">Assigned User *</Label>
              <Select id="assignedUser" name="assignedUser" required>
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          {userRole === UserRole.ADMIN && (
            <div>
              <Label htmlFor="source">Source</Label>
              <Select id="source" name="source" defaultValue={LeadSource.ADMIN_ASSIGNED}>
                {Object.values(LeadSource).map((source) => (
                  <option key={source} value={source}>
                    {source.charAt(0).toUpperCase() + source.slice(1).replace("-", " ")}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Lead"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
