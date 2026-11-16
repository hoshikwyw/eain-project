/**
 * Invitation templates: the registry entries are sound (every starting
 * section passes the schema, each has event details and a required RSVP),
 * and each has its illustration. No server or database needed.
 * Run:  pnpm test:invitations
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, it } from "node:test";
import { sectionSchema } from "../../features/gifts/schemas.ts";
import { getTemplateStyle, templates } from "../../features/gifts/templates.ts";

const INVITATIONS = ["party-invitation", "wedding-invitation", "baby-shower", "graduation-party"];

describe("invitation templates", () => {
  for (const slug of INVITATIONS) {
    it(`${slug} starts with sound sections in both languages`, () => {
      const def = templates[slug];
      assert.ok(def, `${slug} is in the registry`);
      for (const locale of ["en", "my"] as const) {
        const sections = def.defaultSections(locale);
        for (const section of sections) {
          const parsed = sectionSchema.safeParse(section);
          assert.ok(parsed.success, `${slug} ${locale} ${section.type}: ${parsed.error?.message}`);
        }
        const event = sections.find((s) => s.type === "event");
        assert.ok(event, "has event details");
        const rsvp = sections.find((s) => s.type === "question");
        assert.ok(rsvp && rsvp.type === "question", "has an RSVP question");
        assert.equal(rsvp.content.kind, "yes_no");
        assert.equal(rsvp.content.required, true);
        assert.equal(sections[0]?.type, "text", "opens with a cover");
        assert.equal(sections.at(-1)?.type, "final_message", "closes with a sign-off");
      }
    });

    it(`${slug} has an illustration`, () => {
      const style = getTemplateStyle(slug);
      assert.ok(
        existsSync(new URL(`../../public${style.illustration}`, import.meta.url)),
        style.illustration,
      );
    });
  }

  it("two RSVP questions never share an id", () => {
    const a = templates["party-invitation"]!.defaultSections("en").find(
      (s) => s.type === "question",
    );
    const b = templates["party-invitation"]!.defaultSections("en").find(
      (s) => s.type === "question",
    );
    assert.ok(a?.type === "question" && b?.type === "question");
    assert.notEqual(a.content.questionId, b.content.questionId);
  });
});
