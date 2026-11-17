/**
 * The template registry as a whole: every template's starting sections pass
 * the schema in both languages, every template has its illustration, and
 * every design has an opening. No server or database needed.
 * Run:  pnpm test:registry
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, it } from "node:test";
import { sectionSchema } from "../../features/gifts/schemas.ts";
import { getTemplateStyle, templates } from "../../features/gifts/templates.ts";

describe("template registry", () => {
  for (const [slug, def] of Object.entries(templates)) {
    it(`${slug} starts with sound sections and has its picture`, () => {
      for (const locale of ["en", "my"] as const) {
        const sections = def.defaultSections(locale);
        assert.ok(sections.length > 0, "starts with something");
        for (const section of sections) {
          const parsed = sectionSchema.safeParse(section);
          assert.ok(parsed.success, `${slug} ${locale} ${section.type}: ${parsed.error?.message}`);
        }
        const ids = new Set(sections.map((s) => s.id));
        assert.equal(ids.size, sections.length, "section ids are unique");
      }
      const style = getTemplateStyle(slug);
      assert.ok(style.defaultOpening, "has an opening");
      // The blank card and the night garden draw nothing from the illustration folder.
      if (style.design !== "blank" && style.design !== "garden") {
        assert.ok(
          existsSync(new URL(`../../public${style.illustration}`, import.meta.url)),
          style.illustration,
        );
      }
    });
  }
});
