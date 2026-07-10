/** JSON Schemas for OpenAI Structured Outputs (strict). */

export const SEARCH_FILTERS_SCHEMA = {
  type: "object",
  properties: {
    city: { type: ["string", "null"] },
    cities: {
      type: ["array", "null"],
      items: { type: "string" },
    },
    priceMin: { type: ["number", "null"] },
    priceMax: { type: ["number", "null"] },
    bedroomsMin: { type: ["number", "null"] },
    bathroomsMin: { type: ["number", "null"] },
    homeTags: {
      type: ["array", "null"],
      items: {
        type: "string",
        enum: [
          "move-in-ready",
          "under-construction",
          "custom-build",
          "patio-home",
          "single-story",
          "basement",
        ],
      },
    },
    listingCategories: {
      type: ["array", "null"],
      items: {
        type: "string",
        enum: [
          "zero-down",
          "one-level",
          "master-on-main-3-beds",
          "big-incentives",
          "top-ten",
        ],
      },
    },
    offersOnly: { type: "boolean" },
    goodSchools: { type: "boolean" },
    patio: { type: "boolean" },
    semanticQuery: { type: "string" },
  },
  required: [
    "city",
    "cities",
    "priceMin",
    "priceMax",
    "bedroomsMin",
    "bathroomsMin",
    "homeTags",
    "listingCategories",
    "offersOnly",
    "goodSchools",
    "patio",
    "semanticQuery",
  ],
  additionalProperties: false,
} as const;

export const LISTING_EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    community: {
      type: "object",
      properties: {
        name: { type: "string" },
        city: { type: ["string", "null"] },
        description: { type: ["string", "null"] },
        mainHighlight: { type: ["string", "null"] },
        amenities: {
          type: ["array", "null"],
          items: { type: "string" },
        },
        tags: {
          type: ["array", "null"],
          items: { type: "string" },
        },
        schoolDistrict: { type: ["string", "null"] },
        youtubeUrl: { type: ["string", "null"] },
        lenders: {
          type: ["array", "null"],
          items: { type: "string" },
        },
      },
      required: [
        "name",
        "city",
        "description",
        "mainHighlight",
        "amenities",
        "tags",
        "schoolDistrict",
        "youtubeUrl",
        "lenders",
      ],
      additionalProperties: false,
    },
    homes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          modelName: { type: "string" },
          description: { type: ["string", "null"] },
          price: { type: ["number", "null"] },
          bedrooms: { type: ["number", "null"] },
          bathrooms: { type: ["number", "null"] },
          sqft: { type: ["number", "null"] },
          tags: {
            type: ["array", "null"],
            items: {
              type: "string",
              enum: [
                "move-in-ready",
                "under-construction",
                "custom-build",
                "patio-home",
                "single-story",
                "basement",
              ],
            },
          },
          highlights: {
            type: ["array", "null"],
            items: { type: "string" },
          },
          youtubeUrl: { type: ["string", "null"] },
        },
        required: [
          "modelName",
          "description",
          "price",
          "bedrooms",
          "bathrooms",
          "sqft",
          "tags",
          "highlights",
          "youtubeUrl",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["community", "homes"],
  additionalProperties: false,
} as const;

export const STRING_ARRAY_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["items"],
  additionalProperties: false,
} as const;

export const TEXT_RESULT_SCHEMA = {
  type: "object",
  properties: {
    text: { type: "string" },
  },
  required: ["text"],
  additionalProperties: false,
} as const;
