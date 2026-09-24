export type LegalSection = { heading: string; body: string[] };

export type LegalDoc = {
  title: string;
  intro: string;
  /** Plain-language bullets shown above the full text. */
  summary: string[];
  sections: LegalSection[];
  /** ISO date of the last edit to this text. */
  updated: string;
};

export type LegalContent = {
  privacy: LegalDoc;
  terms: LegalDoc;
  security: LegalDoc;
  cookies: LegalDoc;
};

export type LegalKey = keyof LegalContent;
