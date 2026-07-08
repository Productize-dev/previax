import type { Lender } from "./types";

export const seedLenders: Lender[] = [
  {
    id: "lender-1",
    name: "Previax Preferred Lending",
    description:
      "New-construction specialists offering competitive rates, fast closings, and programs tailored for Previax buyers.",
    order: 0,
  },
  {
    id: "lender-2",
    name: "First Heritage Mortgage",
    description:
      "Local loan officers who know North Carolina communities and builder incentive packages inside and out.",
    order: 1,
  },
  {
    id: "lender-3",
    name: "Maria Chen",
    description:
      "Senior loan officer focused on first-time buyers — patient guidance from pre-approval through closing day.",
    order: 2,
  },
  {
    id: "lender-4",
    name: "Carolina Home Finance",
    description:
      "FHA, VA, and conventional options with dedicated support for move-in-ready and custom-build timelines.",
    order: 3,
  },
];
