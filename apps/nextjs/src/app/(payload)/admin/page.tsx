import { redirect } from "next/navigation";

import { auth } from "@acme/auth";

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="container mx-auto py-16">
      <h1 className="mb-8 text-4xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-lg bg-muted p-6">
          <h2 className="mb-4 text-2xl font-semibold">Notifications</h2>
          <p className="text-muted-foreground">
            Send and manage system notifications
          </p>
        </div>
        <div className="rounded-lg bg-muted p-6">
          <h2 className="mb-4 text-2xl font-semibold">Posts</h2>
          <p className="text-muted-foreground">Manage user posts and content</p>
        </div>
      </div>
    </div>
  );
}
