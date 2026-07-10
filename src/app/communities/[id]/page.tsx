import { Suspense } from "react";

import CommunityDetailContent from "@/components/communities/community-detail-content";

export default function CommunityDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <CommunityDetailContent />
    </Suspense>
  );
}
