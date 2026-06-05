/**
 * Offline Storage Utilities
 * Menyimpan data lokal saat offline untuk di-sync saat online
 */

export interface OfflineMessage {
    id: string;
    type: "api" | "action";
    payload: Record<string, any>;
    timestamp: number;
    retries: number;
}

const OFFLINE_STORE_KEY = "whatsapp_bot_offline_queue";
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

class OfflineStorage {
    /**
     * Tambah message ke offline queue
     */
    addMessage(message: Omit<OfflineMessage, "id" | "timestamp" | "retries">) {
        try {
            const messages = this.getMessages();
            const newMessage: OfflineMessage = {
                id: `${Date.now()}-${Math.random()}`,
                timestamp: Date.now(),
                retries: 0,
                ...message,
            };

            messages.push(newMessage);
            localStorage.setItem(OFFLINE_STORE_KEY, JSON.stringify(messages));
            return newMessage.id;
        } catch (error) {
            console.error("Error adding offline message:", error);
            return null;
        }
    }

    /**
     * Get semua messages dari offline queue
     */
    getMessages(): OfflineMessage[] {
        try {
            const data = localStorage.getItem(OFFLINE_STORE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error("Error reading offline messages:", error);
            return [];
        }
    }

    /**
     * Get message by ID
     */
    getMessage(id: string): OfflineMessage | null {
        const messages = this.getMessages();
        return messages.find((m) => m.id === id) || null;
    }

    /**
     * Remove message dari queue
     */
    removeMessage(id: string) {
        try {
            const messages = this.getMessages();
            const filtered = messages.filter((m) => m.id !== id);
            localStorage.setItem(OFFLINE_STORE_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error("Error removing offline message:", error);
        }
    }

    /**
     * Update retry count
     */
    incrementRetry(id: string) {
        try {
            const messages = this.getMessages();
            const message = messages.find((m) => m.id === id);
            if (message) {
                message.retries++;
                localStorage.setItem(
                    OFFLINE_STORE_KEY,
                    JSON.stringify(messages),
                );
            }
        } catch (error) {
            console.error("Error incrementing retry:", error);
        }
    }

    /**
     * Clear semua messages
     */
    clear() {
        try {
            localStorage.removeItem(OFFLINE_STORE_KEY);
        } catch (error) {
            console.error("Error clearing offline messages:", error);
        }
    }

    /**
     * Check jika ada pending messages
     */
    hasPendingMessages(): boolean {
        return this.getMessages().length > 0;
    }

    /**
     * Get messages yang perlu di-retry
     */
    getRetryableMessages(): OfflineMessage[] {
        return this.getMessages().filter((m) => m.retries < MAX_RETRIES);
    }
}

export const offlineStorage = new OfflineStorage();

/**
 * Hook untuk handle offline queue sync
 */
export async function syncOfflineQueue(
    syncHandler: (message: OfflineMessage) => Promise<boolean>,
): Promise<{ synced: number; failed: number }> {
    const messages = offlineStorage.getRetryableMessages();
    let synced = 0;
    let failed = 0;

    for (const message of messages) {
        try {
            const success = await syncHandler(message);
            if (success) {
                offlineStorage.removeMessage(message.id);
                synced++;
            } else {
                offlineStorage.incrementRetry(message.id);
                failed++;
            }
        } catch (error) {
            console.error(`Error syncing message ${message.id}:`, error);
            offlineStorage.incrementRetry(message.id);
            failed++;
        }
    }

    return { synced, failed };
}
