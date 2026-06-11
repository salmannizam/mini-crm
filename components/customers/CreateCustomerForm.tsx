"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { UserRole } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";

interface CreateCustomerFormProps {
  userRole: string;
  userId: string;
}

export function CreateCustomerForm({ userRole, userId }: CreateCustomerFormProps) {
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

      // Admin must select a user to assign
      const assignedUser = data.assignedUser as string;
      if (!assignedUser || assignedUser === "" || !/^[0-9a-fA-F]{24}$/.test(assignedUser)) {
        addToast({
          title: "Error",
          description: "Please select a valid user to assign this customer to",
          variant: "error",
        });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        addToast({ title: "Success", description: "Customer created successfully", variant: "success" });
        router.push(`/customers/${result.customer._id}`);
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to create customer" }));
        addToast({ title: "Error", description: error.error || "Failed to create customer", variant: "error" });
        setLoading(false);
      }
    } catch (error) {
      console.error("Error creating customer:", error);
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
        <CardTitle>Create New Customer</CardTitle>
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
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <Input id="businessType" name="businessType" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input id="address" name="address" required />
            </div>
            <div>
              <Label htmlFor="assignedUser">Assign To *</Label>
              <Select id="assignedUser" name="assignedUser" required>
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Customer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}