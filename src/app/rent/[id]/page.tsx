import { Suspense } from "react";

import ApartmentDetailContent from "@/components/apartments/apartment-detail-content";

export default function ApartmentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-[#141414]">
          <p className="text-[#b3b3b3]">Loading...</p>
        </div>
      }
    >
      <ApartmentDetailContent />
    </Suspense>
  );
}
