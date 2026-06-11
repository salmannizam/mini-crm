"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserRole } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import dayjs from "dayjs";

interface CustomerDetailProps {
  customerId: string;
  userRole: string;
  userId: string;
}

interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  businessType?: string;
  assignedUser: { _id: string; name: string; email: string };
  createdBy: { name: string; email: string };
  notes: Array<{
    _id: string;
    text: string;
    createdBy: { name: string; email: string };
    createdAt: string;
  }>;
  documents: Array<{
    _id: string;
    name: string;
    url: string;
    uploadedBy: { name: string; email: string };
    createdAt: string;
  }>;
  communicationHistory: Array<{
    _id: string;
    type: string;
    notes: string;
    date: string;
    createdBy: { name: string; email: string };
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function CustomerDetail({ customerId, userRole, userId }: CustomerDetailProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [noteText, setNoteText] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [commType, setCommType] = useState("");
  const [commNotes, setCommNotes] = useState("");
  const [commDate, setCommDate] = useState("");

  useEffect(() => {
    fetchCustomer();
    if (userRole === UserRole.ADMIN) {
      fetchUsers();
    }
  }, [customerId, userRole]);

  const fetchCustomer = async () => {
    setLoading(true);
    const res = await fetch(`/api/customers/${customerId}`);
    if (res.ok) {
      const data = await res.json();
      setCustomer(data.customer);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    const res = await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      addToast({ title: "Success", description: "Customer updated successfully", variant: "success" });
      setEditing(false);
      fetchCustomer();
    } else {
      const error = await res.json();
      addToast({ title: "Error", description: error.error || "Failed to update customer", variant: "error" });
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/customers/${customerId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: noteText }),
    });

    if (res.ok) {
      addToast({ title: "Success", description: "Note added", variant: "success" });
      setNoteText("");
      fetchCustomer();
    } else {
      addToast({ title: "Error", description: "Failed to add note", variant: "error" });
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/customers/${customerId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: documentName, url: documentUrl }),
    });

    if (res.ok) {
      addToast({ title: "Success", description: "Document uploaded", variant: "success" });
      setDocumentName("");
      setDocumentUrl("");
      fetchCustomer();
    } else {
      addToast({ title: "Error", description: "Failed to upload document", variant: "error" });
    }
  };

  const handleAddCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/customers/${customerId}/communications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: commType, notes: commNotes, date: commDate }),
    });

    if (res.ok) {
      addToast({ title: "Success", description: "Communication added", variant: "success" });
      setCommType("");
      setCommNotes("");
      setCommDate("");
      fetchCustomer();
    } else {
      addToast({ title: "Error", description: "Failed to add communication", variant: "error" });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!customer) {
    return <div>Customer not found</div>;
  }

  const canEdit = userRole === UserRole.ADMIN || customer.assignedUser._id === userId;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="communications">Communication History</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Customer Information</CardTitle>
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => setEditing(!editing)}
                  >
                    {editing ? "Cancel" : "Edit"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={customer.name}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={customer.email || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={customer.phone || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessType">Business Type</Label>
                      <Input
                        id="businessType"
                        name="businessType"
                        defaultValue={customer.businessType || ""}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        defaultValue={customer.address}
                        required
                      />
                    </div>
                    {userRole === UserRole.ADMIN && (
                      <div>
                        <Label htmlFor="assignedUser">Assigned To</Label>
                        <Select
                          id="assignedUser"
                          name="assignedUser"
                          defaultValue={customer.assignedUser._id}
                        >
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </Select>
                      </div>
                    )}
                  </div>
                  <Button type="submit">Update Customer</Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                      <p className="text-lg">{customer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                      <p>{customer.email || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                      <p>{customer.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Type</p>
                      <p>{customer.businessType || "Not provided"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                      <p>{customer.address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned To</p>
                      <p>{customer.assignedUser?.name || "Unassigned"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</p>
                      <p>{customer.createdBy?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</p>
                      <p>{dayjs(customer.createdAt).format("MMM D, YYYY")}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {canEdit && (
                <form onSubmit={handleAddNote} className="mb-6 space-y-4">
                  <div>
                    <Label htmlFor="newNote">Add New Note</Label>
                    <Textarea
                      id="newNote"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Enter your note here..."
                      required
                    />
                  </div>
                  <Button type="submit">Add Note</Button>
                </form>
              )}
              <div className="space-y-4">
                {customer.notes.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No notes yet</p>
                ) : (
                  customer.notes.map((note) => (
                    <div key={note._id} className="border rounded-lg p-4">
                      <p>{note.text}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Added by {note.createdBy.name} on {dayjs(note.createdAt).format("MMM D, YYYY")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {canEdit && (
                <form onSubmit={handleAddDocument} className="mb-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="docName">Document Name</Label>
                      <Input
                        id="docName"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        placeholder="Document name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="docUrl">Document URL</Label>
                      <Input
                        id="docUrl"
                        value={documentUrl}
                        onChange={(e) => setDocumentUrl(e.target.value)}
                        placeholder="https://..."
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit">Upload Document</Button>
                </form>
              )}
              <div className="space-y-4">
                {customer.documents.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
                ) : (
                  customer.documents.map((doc) => (
                    <div key={doc._id} className="border rounded-lg p-4">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                        {doc.name}
                      </a>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Uploaded by {doc.uploadedBy.name} on {dayjs(doc.createdAt).format("MMM D, YYYY")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications">
          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
            </CardHeader>
            <CardContent>
              {canEdit && (
                <form onSubmit={handleAddCommunication} className="mb-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="commType">Type</Label>
                      <Input
                        id="commType"
                        value={commType}
                        onChange={(e) => setCommType(e.target.value)}
                        placeholder="Call, Email, Meeting..."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="commDate">Date</Label>
                      <Input
                        id="commDate"
                        type="date"
                        value={commDate}
                        onChange={(e) => setCommDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="commNotes">Notes</Label>
                    <Textarea
                      id="commNotes"
                      value={commNotes}
                      onChange={(e) => setCommNotes(e.target.value)}
                      placeholder="Communication notes..."
                      required
                    />
                  </div>
                  <Button type="submit">Add Communication</Button>
                </form>
              )}
              <div className="space-y-4">
                {customer.communicationHistory.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No communications logged yet</p>
                ) : (
                  customer.communicationHistory
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((comm) => (
                      <div key={comm._id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{comm.type}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {dayjs(comm.date).format("MMM D, YYYY")}
                          </span>
                        </div>
                        <p>{comm.notes}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Logged by {comm.createdBy.name}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}