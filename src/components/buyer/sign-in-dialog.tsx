"use client";

import { PreviaxLogo } from "@/components/layout/previax-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBuyer } from "@/context/buyer-context";

type SignInDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const { signIn } = useBuyer();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    signIn({
      name: String(fd.get("name")),
      email: String(fd.get("email")),
    });
    onOpenChange(false);
    e.currentTarget.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <PreviaxLogo height={72} asLink={false} className="mx-auto" />
          <DialogTitle>Welcome to Previax</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Save your profile locally to personalize your experience. No password
          needed for now.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="signin-name">Name</Label>
            <Input id="signin-name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input id="signin-email" name="email" type="email" required />
          </div>
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
