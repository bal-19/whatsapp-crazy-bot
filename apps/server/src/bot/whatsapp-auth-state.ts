import {
  BufferJSON,
  initAuthCreds,
  proto,
  type AuthenticationCreds,
  type AuthenticationState,
  type SignalDataSet,
  type SignalDataTypeMap
} from '@whiskeysockets/baileys';
import { supabaseAdmin } from '../lib/supabase.js';

type AuthCategory = keyof SignalDataTypeMap | 'creds';

interface AuthStateRow {
  category: AuthCategory;
  key_id: string;
  value: unknown;
}

interface AuthStateStore {
  loadCreds(): Promise<AuthenticationCreds>;
  saveCreds(creds: AuthenticationCreds): Promise<void>;
  getKeys<T extends keyof SignalDataTypeMap>(type: T, ids: string[]): Promise<{ [id: string]: SignalDataTypeMap[T] }>;
  setKeys(data: SignalDataSet): Promise<void>;
  clear(): Promise<void>;
}

const CREDS_CATEGORY = 'creds';
const CREDS_KEY_ID = 'default';

export async function createWhatsAppAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clear: () => Promise<void>;
}> {
  const store = getAuthStateStore();
  const creds = await store.loadCreds();

  return {
    state: {
      creds,
      keys: {
        get: (type, ids) => store.getKeys(type, ids),
        set: (data) => store.setKeys(data)
      }
    },
    saveCreds: () => store.saveCreds(creds),
    clear: () => store.clear()
  };
}

let inMemoryStore: InMemoryAuthStateStore | null = null;

function getAuthStateStore(): AuthStateStore {
  if (supabaseAdmin) {
    return new SupabaseAuthStateStore();
  }

  inMemoryStore ??= new InMemoryAuthStateStore();
  return inMemoryStore;
}

class InMemoryAuthStateStore implements AuthStateStore {
  private creds: AuthenticationCreds = initAuthCreds();
  private keys = new Map<string, unknown>();

  async loadCreds(): Promise<AuthenticationCreds> {
    return this.creds;
  }

  async saveCreds(creds: AuthenticationCreds): Promise<void> {
    this.creds = reviveAuthValue(serializeAuthValue(creds)) as AuthenticationCreds;
  }

  async getKeys<T extends keyof SignalDataTypeMap>(
    type: T,
    ids: string[]
  ): Promise<{ [id: string]: SignalDataTypeMap[T] }> {
    const result = {} as { [id: string]: SignalDataTypeMap[T] };

    for (const id of ids) {
      const value = this.keys.get(toStoreKey(type, id));
      if (value !== undefined) {
        result[id] = transformStoredValue(type, reviveAuthValue(value));
      }
    }

    return result;
  }

  async setKeys(data: SignalDataSet): Promise<void> {
    for (const category of Object.keys(data) as (keyof SignalDataTypeMap)[]) {
      const entries = data[category];
      if (!entries) continue;

      for (const [id, value] of Object.entries(entries)) {
        const key = toStoreKey(category, id);
        if (value === null) {
          this.keys.delete(key);
          continue;
        }

        this.keys.set(key, serializeAuthValue(value));
      }
    }
  }

  async clear(): Promise<void> {
    this.creds = initAuthCreds();
    this.keys.clear();
  }
}

class SupabaseAuthStateStore implements AuthStateStore {
  async loadCreds(): Promise<AuthenticationCreds> {
    const { data, error } = await supabaseAdmin!
      .from('whatsapp_auth_state')
      .select('value')
      .eq('category', CREDS_CATEGORY)
      .eq('key_id', CREDS_KEY_ID)
      .maybeSingle();

    assertSupabaseSuccess(error, 'Gagal membaca auth creds WhatsApp dari Supabase.');
    return data?.value ? (reviveAuthValue(data.value) as AuthenticationCreds) : initAuthCreds();
  }

  async saveCreds(creds: AuthenticationCreds): Promise<void> {
    const payload = {
      category: CREDS_CATEGORY,
      key_id: CREDS_KEY_ID,
      value: serializeAuthValue(creds),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseAdmin!
      .from('whatsapp_auth_state')
      .upsert(payload, { onConflict: 'category,key_id' });

    assertSupabaseSuccess(error, 'Gagal menyimpan auth creds WhatsApp ke Supabase.');
  }

  async getKeys<T extends keyof SignalDataTypeMap>(
    type: T,
    ids: string[]
  ): Promise<{ [id: string]: SignalDataTypeMap[T] }> {
    if (ids.length === 0) {
      return {} as { [id: string]: SignalDataTypeMap[T] };
    }

    const { data, error } = await supabaseAdmin!
      .from('whatsapp_auth_state')
      .select('key_id, value')
      .eq('category', type)
      .in('key_id', ids);

    assertSupabaseSuccess(error, `Gagal membaca auth key WhatsApp kategori "${type}" dari Supabase.`);

    const result = {} as { [id: string]: SignalDataTypeMap[T] };
    for (const row of (data ?? []) as Pick<AuthStateRow, 'key_id' | 'value'>[]) {
      result[row.key_id] = transformStoredValue(type, reviveAuthValue(row.value));
    }

    return result;
  }

  async setKeys(data: SignalDataSet): Promise<void> {
    const upserts: AuthStateRow[] = [];
    const deletions: Array<{ category: keyof SignalDataTypeMap; keyId: string }> = [];

    for (const category of Object.keys(data) as (keyof SignalDataTypeMap)[]) {
      const entries = data[category];
      if (!entries) continue;

      for (const [id, value] of Object.entries(entries)) {
        if (value === null) {
          deletions.push({ category, keyId: id });
          continue;
        }

        upserts.push({
          category,
          key_id: id,
          value: serializeAuthValue(value)
        });
      }
    }

    if (upserts.length > 0) {
      const payload = upserts.map((entry) => ({
        ...entry,
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabaseAdmin!
        .from('whatsapp_auth_state')
        .upsert(payload, { onConflict: 'category,key_id' });

      assertSupabaseSuccess(error, 'Gagal menyimpan auth keys WhatsApp ke Supabase.');
    }

    if (deletions.length > 0) {
      await Promise.all(
        deletions.map(async ({ category, keyId }) => {
          const { error } = await supabaseAdmin!
            .from('whatsapp_auth_state')
            .delete()
            .eq('category', category)
            .eq('key_id', keyId);

          assertSupabaseSuccess(
            error,
            `Gagal menghapus auth key WhatsApp kategori "${category}" dari Supabase.`
          );
        })
      );
    }
  }

  async clear(): Promise<void> {
    const { error } = await supabaseAdmin!.from('whatsapp_auth_state').delete().neq('category', '');
    assertSupabaseSuccess(error, 'Gagal menghapus auth state WhatsApp dari Supabase.');
  }
}

function toStoreKey(category: keyof SignalDataTypeMap, id: string): string {
  return `${category}:${id}`;
}

function serializeAuthValue(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, BufferJSON.replacer));
}

function reviveAuthValue(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value), BufferJSON.reviver);
}

function transformStoredValue<T extends keyof SignalDataTypeMap>(type: T, value: unknown): SignalDataTypeMap[T] {
  if (type === 'app-state-sync-key') {
    return proto.Message.AppStateSyncKeyData.fromObject(value as object) as unknown as SignalDataTypeMap[T];
  }

  return value as SignalDataTypeMap[T];
}

function assertSupabaseSuccess(error: { message?: string } | null, fallbackMessage: string): void {
  if (!error) return;

  const message = error.message?.includes('relation')
    ? `${fallbackMessage} Kemungkinan migration Supabase untuk auth state belum dijalankan.`
    : `${fallbackMessage} ${error.message ?? ''}`.trim();

  throw new Error(message);
}
