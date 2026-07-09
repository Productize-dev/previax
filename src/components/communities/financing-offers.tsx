"use client";

import {
  isOfferExpired,
  isOfferExpiringSoon,
} from "@/lib/community-utils";
import { useData } from "@/context/data-context";
import type { LenderOffer } from "@/lib/types";

type FinancingOffersProps = {
  communityId: string;
};

function isOfferVisible(offer: LenderOffer): boolean {
  if (!offer.isActive) return false;
  if (offer.validUntil && isOfferExpired(offer.validUntil)) return false;
  return true;
}

export function FinancingOffers({ communityId }: FinancingOffersProps) {
  const { lenderOffers, lenders } = useData();

  const offers = lenderOffers
    .filter((o) => o.communityId === communityId)
    .filter(isOfferVisible);

  if (offers.length === 0) return null;

  const lenderName = (id: string) =>
    lenders.find((l) => l.id === id)?.name ?? "Preferred lender";

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-2xl text-white">Financing offers</h2>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {offers.map((offer) => {
          const expiringSoon =
            offer.validUntil && isOfferExpiringSoon(offer.validUntil);
          const expired =
            offer.validUntil && isOfferExpired(offer.validUntil);

          return (
            <li
              key={offer.id}
              className="overflow-hidden rounded-xl border border-[#46d369]/30 bg-gradient-to-br from-[#46d369]/10 to-transparent"
            >
              {offer.imageUrl && (
                <div className="aspect-[16/9] w-full overflow-hidden">
                  <img
                    src={offer.imageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              )}
              <div className="px-4 py-4">
                <p className="text-xs text-[#b3b3b3]">
                  {lenderName(offer.lenderId)}
                </p>
                <p className="mt-1 font-medium text-white">{offer.title}</p>
                {(offer.rate || offer.terms) && (
                  <p className="mt-1 text-sm text-[#46d369]">
                    {[offer.rate, offer.terms].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="mt-2 text-sm leading-relaxed text-[#b3b3b3]">
                  {offer.description}
                </p>
                {offer.validUntil && !expired && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {expiringSoon && (
                      <span className="rounded-full bg-[#46d369]/20 px-3 py-0.5 text-xs font-medium text-[#46d369]">
                        Limited time
                      </span>
                    )}
                    <span className="text-xs text-[#b3b3b3]">
                      Through{" "}
                      {new Date(offer.validUntil).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
