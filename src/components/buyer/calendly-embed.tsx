import { CALENDLY_URL } from "@/lib/config";

export function CalendlyEmbed() {
  if (!CALENDLY_URL) return null;

  return (
    <section>
      <h2 className="font-heading mb-4 text-2xl">Schedule a Tour</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Pick a time that works for you — our team will confirm your visit.
      </p>
      <div className="overflow-hidden rounded-xl border border-border">
        <iframe
          src={CALENDLY_URL}
          title="Schedule a tour"
          className="h-[630px] w-full"
          loading="lazy"
        />
      </div>
    </section>
  );
}
