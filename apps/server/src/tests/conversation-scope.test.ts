import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { proto } from "@whiskeysockets/baileys";
import { resolveConversationScope } from "../bot/conversation-scope.js";

describe("resolveConversationScope", () => {
    it("uses the personal JID for direct chats", () => {
        const scope = resolveConversationScope(
            createMessage({ remoteJid: "628111@s.whatsapp.net" }),
        );

        assert.ok(scope);
        assert.equal(scope.contactId, "628111@s.whatsapp.net");
        assert.equal(scope.contactJid, "628111@s.whatsapp.net");
        assert.equal(scope.deliveryJid, "628111@s.whatsapp.net");
        assert.equal(scope.isGroup, false);
        assert.equal(scope.usedGroupFallback, false);
    });

    it("scopes group conversations per participant", () => {
        const scope = resolveConversationScope(
            createMessage({
                remoteJid: "120363@g.us",
                participant: "628222@s.whatsapp.net",
            }),
        );

        assert.ok(scope);
        assert.equal(
            scope.contactId,
            "120363@g.us::628222@s.whatsapp.net",
        );
        assert.equal(scope.contactJid, "628222@s.whatsapp.net");
        assert.equal(scope.deliveryJid, "120363@g.us");
        assert.equal(scope.groupJid, "120363@g.us");
        assert.equal(scope.participantJid, "628222@s.whatsapp.net");
        assert.equal(scope.isGroup, true);
        assert.equal(scope.usedGroupFallback, false);
    });

    it("falls back to the group JID when participant is missing", () => {
        const scope = resolveConversationScope(
            createMessage({ remoteJid: "120363@g.us" }),
        );

        assert.ok(scope);
        assert.equal(scope.contactId, "120363@g.us");
        assert.equal(scope.contactJid, "120363@g.us");
        assert.equal(scope.deliveryJid, "120363@g.us");
        assert.equal(scope.groupJid, "120363@g.us");
        assert.equal(scope.participantJid, null);
        assert.equal(scope.isGroup, true);
        assert.equal(scope.usedGroupFallback, true);
    });
});

function createMessage(input: {
    remoteJid: string;
    participant?: string;
}): proto.IWebMessageInfo {
    return {
        key: {
            remoteJid: input.remoteJid,
            participant: input.participant,
        },
    } as proto.IWebMessageInfo;
}
