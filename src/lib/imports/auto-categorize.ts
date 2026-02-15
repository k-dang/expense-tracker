const KEYWORD_CATEGORIES: { keywords: string[]; category: string }[] = [
  {
    keywords: [
      "grocery",
      "supermarket",
      "loblaws",
      "metro",
      "no frills",
      "freshco",
      "sobeys",
      "walmart",
      "costco",
    ],
    category: "Groceries",
  },
  {
    keywords: [
      "restaurant",
      "mcdonald",
      "tim horton",
      "starbucks",
      "subway",
      "pizza",
      "cafe",
      "coffee",
      "doordash",
      "uber eats",
      "skip the dishes",
    ],
    category: "Dining",
  },
  {
    keywords: [
      "uber",
      "lyft",
      "taxi",
      "transit",
      "presto",
      "gas",
      "shell",
      "petro",
      "esso",
      "parking",
    ],
    category: "Transport",
  },
  {
    keywords: ["amazon", "best buy", "canadian tire", "shoppers", "dollarama"],
    category: "Shopping",
  },
  {
    keywords: [
      "netflix",
      "spotify",
      "disney",
      "apple",
      "google",
      "subscription",
    ],
    category: "Entertainment",
  },
  {
    keywords: [
      "hydro",
      "enbridge",
      "rogers",
      "bell",
      "telus",
      "fido",
      "internet",
      "phone",
      "insurance",
    ],
    category: "Utilities",
  },
  {
    keywords: ["pharmacy", "dentist", "doctor", "medical", "health", "clinic"],
    category: "Health",
  },
  {
    keywords: ["rent", "mortgage", "condo"],
    category: "Housing",
  },
];

export function categorize(description: string): string {
  const lower = description.toLowerCase();
  for (const entry of KEYWORD_CATEGORIES) {
    if (entry.keywords.some((keyword) => lower.includes(keyword))) {
      return entry.category;
    }
  }
  return "Uncategorized";
}
