import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { appDb } from "../db/database.js";
import { isContactBlocked } from "../bot/contact-policy.js";

describe("isContactBlocked", () => {
    it("returns true only for contacts marked as blocked", async () => {
        const blockedJid = `blocked-${Date.now()}@s.whatsapp.net`;
        const activeJid = `active-${Date.now()}@s.whatsapp.net`;

        await appDb.createContact({
            id: blockedJid,
            name: "Blocked User",
            is_blocked: true,
        });
        await appDb.createContact({
            id: activeJid,
            name: "Active User",
            is_blocked: false,
        });

        assert.equal(await isContactBlocked(blockedJid), true);
        assert.equal(await isContactBlocked(activeJid), false);
        assert.equal(
            await isContactBlocked(`unknown-${Date.now()}@s.whatsapp.net`),
            false,
        );
    });

    it("keeps the blocked state when contact identity is upserted", async () => {
        const contactJid = `blocked-upsert-${Date.now()}@s.whatsapp.net`;
        await appDb.createContact({ id: contactJid, is_blocked: true });

        await appDb.upsertContact(contactJid, "Updated Push Name");

        assert.equal(await isContactBlocked(contactJid), true);
    });
});
