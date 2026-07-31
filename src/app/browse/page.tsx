import { Suspense } from "react";

import { NetflixHomepage } from "@/components/home/netflix-homepage";
import { SearchUrlHandler } from "@/components/home/search-url-handler";

export default function BrowsePage() {
  return (
    <>
      <Suspense fallback={null}>
        <SearchUrlHandler />
      </Suspense>
      <NetflixHomepage />
    </>
  );
}
