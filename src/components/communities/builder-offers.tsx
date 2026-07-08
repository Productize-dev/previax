import {
  isOfferExpired,
  isOfferExpiringSoon,
} from "@/lib/community-utils";

type BuilderOffersProps = {
  builderName: string;
  builderOffers: string;
  offerExpires?: string;
};

export function BuilderOffers({
  builderName,
  builderOffers,
  offerExpires,
}: BuilderOffersProps) {
  const offers = builderOffers
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (offers.length === 0) return null;

  const expiringSoon = isOfferExpiringSoon(offerExpires);
  const expired = isOfferExpired(offerExpires);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-2xl">Builder Offers</h2>
        {expiringSoon && !expired && (
          <span className="rounded-full bg-primary/20 px-3 py-0.5 text-xs font-medium text-primary">
            Limited time
          </span>
        )}
        {offerExpires && !expired && (
          <span className="text-xs text-muted-foreground">
            Through {new Date(offerExpires).toLocaleDateString()}
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Verified partner — {builderName}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {offers.map((offer) => (
          <li
            key={offer}
            className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent px-4 py-4"
          >
            <span className="text-sm leading-relaxed">{offer}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
