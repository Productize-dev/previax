import { Suspense } from "react";

import RentBrowseContent from "@/components/apartments/rent-browse-content";

export default function RentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-[#141414]">
          <p className="text-[#b3b3b3]">Loading...</p>
        </div>
      }
    >
      <RentBrowseContent />
    </Suspense>
  );
}
