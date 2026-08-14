import type { ApartmentCommunity } from "./types";

export const seedApartmentCommunities: ApartmentCommunity[] = [
  {
    id: "seed-apt-ballantyne",
    name: "Ballantyne Crossings",
    city: "Charlotte",
    description:
      "Furnished and unfurnished apartments near Ballantyne — a flexible landing spot while you tour new construction homes across the Charlotte metro.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
    youtubeUrl: "",
    leasingName: "Leasing Desk",
    leasingPhone: "(704) 555-0142",
    leasingEmail: "leasing@ballantynecrossings.example",
    leasingPhotoUrl: "",
    tagline: "Rent while you relocate",
    amenities: ["Pool", "Fitness center", "Pet friendly", "Covered parking"],
    mediaGallery: [],
    isHidden: false,
    createdAt: Date.UTC(2024, 0, 15),
    floorPlans: [
      {
        id: "seed-apt-ballantyne-1br",
        name: "The Rowan",
        rent: 1650,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 780,
        imageUrls: [
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
        ],
        description: "One-bedroom open plan with balcony and in-unit laundry.",
        status: "available",
        amenities: ["In-unit laundry", "Balcony"],
        highlights: ["Move-in ready"],
      },
      {
        id: "seed-apt-ballantyne-2br",
        name: "The Cedar",
        rent: 2100,
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1120,
        imageUrls: [
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
        ],
        description: "Two-bedroom corner unit with dual closets and work nook.",
        status: "available",
        amenities: ["Corner unit", "Work nook"],
        highlights: ["Short-term lease available"],
      },
    ],
  },
];
