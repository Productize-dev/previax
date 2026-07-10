import { Suspense } from "react";

import SavedPageClient from "./saved-page-client";

export default function SavedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#141414] pt-24 text-center text-[#b3b3b3]">
          Loading...
        </div>
      }
    >
      <SavedPageClient />
    </Suspense>
  );
}
