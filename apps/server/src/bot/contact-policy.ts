import { appDb } from "../db/database.js";

export async function isContactBlocked(contactJid: string): Promise<boolean> {
    const contact = await appDb.getContact(contactJid);
    return contact?.is_blocked === true;
}
