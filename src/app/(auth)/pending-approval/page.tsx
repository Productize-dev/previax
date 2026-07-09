import Link from "next/link";
import { Clock } from "lucide-react";

import { getCurrentProfile } from "@/lib/auth/server";

export default async function PendingApprovalPage() {
  const profile = await getCurrentProfile();
  const rejected = profile?.status === "rejected";

  return (
    <div className="space-y-4 text-center">
      <Clock className="mx-auto size-10 text-primary" />
      <h1 className="font-heading text-2xl">
        {rejected ? "Account not approved" : "Pending approval"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {rejected
          ? "Your account request was declined. Contact the Previax team if you think this is a mistake."
          : `Your ${profile?.role ?? ""} account is waiting for a Previax admin to approve it. You'll be able to access the dashboard once it's active.`}
      </p>
      <p className="text-sm text-muted-foreground">
        <Link
          href="/logout"
          className="text-foreground underline underline-offset-4 hover:text-primary"
        >
          Sign out
        </Link>
      </p>
    </div>
  );
}
