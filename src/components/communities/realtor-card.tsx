import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildContactMailto } from "@/lib/config";

type RealtorCardProps = {
  name: string;
  photoUrl: string;
  communityName: string;
};

export function RealtorCard({
  name,
  photoUrl,
  communityName,
}: RealtorCardProps) {
  const mailtoHref = buildContactMailto(communityName, name);

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-5 pt-6">
        <img
          src={photoUrl}
          alt={name}
          className="size-20 rounded-full border-2 border-primary/30 object-cover"
        />
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-primary">
            Your Realtor
          </p>
          <p className="font-heading mt-1 text-xl">{name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ready to help you find your home in {communityName}
          </p>
        </div>
        <Button
          size="lg"
          render={<a href={mailtoHref} />}
          nativeButton={false}
        >
          Contact
        </Button>
      </CardContent>
    </Card>
  );
}
