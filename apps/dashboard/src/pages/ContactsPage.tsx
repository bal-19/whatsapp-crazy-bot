import { Loader2, Plus, Save, ShieldBan, Trash2, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Contact, CreateContactRequest, UpdateContactRequest } from '@whatsapp-bot/shared';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Switch } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { contactService } from '@/lib/services/contactService';
import { useUIStore } from '@/stores/uiStore';

interface ContactFormState {
    id: string;
    name: string;
    is_blocked: boolean;
    last_seen: string;
}

const EMPTY_FORM: ContactFormState = {
    id: '',
    name: '',
    is_blocked: false,
    last_seen: ''
};

export function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [form, setForm] = useState<ContactFormState>(EMPTY_FORM);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const addToast = useUIStore((state) => state.addToast);

    const selectedContact = useMemo(
        () => contacts.find((contact) => contact.id === selectedId) ?? null,
        [contacts, selectedId]
    );

    useEffect(() => {
        void loadContacts();
    }, []);

    useEffect(() => {
        if (isCreating) {
            setForm(EMPTY_FORM);
            return;
        }

        if (selectedContact) {
            setForm(toFormState(selectedContact));
        }
    }, [isCreating, selectedContact]);

    async function loadContacts() {
        setIsLoading(true);
        try {
            const data = await contactService.getAll();
            setContacts(data);
            if (!isCreating) {
                setSelectedId((current) => current ?? data[0]?.id ?? null);
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        const trimmedId = form.id.trim();
        const trimmedName = form.name.trim();

        if (!trimmedId) {
            addToast({ type: 'warning', message: 'WhatsApp JID wajib diisi.' });
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                id: trimmedId,
                name: trimmedName || null,
                is_blocked: form.is_blocked,
                last_seen: form.last_seen ? new Date(form.last_seen).toISOString() : null
            };

            if (isCreating) {
                const created = await contactService.create(payload satisfies CreateContactRequest);
                const nextContacts = [created, ...contacts.filter((contact) => contact.id !== created.id)];
                setContacts(nextContacts);
                setSelectedId(created.id);
                setIsCreating(false);
                addToast({ type: 'success', message: 'Contact berhasil dibuat.' });
            } else if (selectedContact) {
                const patch: UpdateContactRequest = {
                    id: payload.id !== selectedContact.id ? payload.id : undefined,
                    name: payload.name,
                    is_blocked: payload.is_blocked,
                    last_seen: payload.last_seen
                };
                const updated = await contactService.update(selectedContact.id, patch);
                setContacts((current) =>
                    current
                        .map((contact) => (contact.id === selectedContact.id ? updated : contact))
                        .sort(sortContacts)
                );
                setSelectedId(updated.id);
                addToast({ type: 'success', message: 'Contact berhasil diupdate.' });
            }
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!selectedContact) return;

        const confirmed = window.confirm(
            `Hapus contact ${selectedContact.id}? Semua history message terkait juga akan ikut terhapus.`
        );
        if (!confirmed) return;

        setIsDeleting(true);
        try {
            await contactService.remove(selectedContact.id);
            const remaining = contacts.filter((contact) => contact.id !== selectedContact.id);
            setContacts(remaining);
            setSelectedId(remaining[0]?.id ?? null);
            setIsCreating(false);
            addToast({ type: 'success', message: 'Contact berhasil dihapus.' });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="flex h-full flex-col gap-6 sm:gap-7">
            <Card className="mesh-card">
                <CardContent className="flex flex-wrap items-end justify-between gap-5 p-6 sm:p-7 lg:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Contacts Database</p>
                        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Contacts</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">Kelola penuh data pada tabel `contacts` dari dashboard dengan panel list dan editor yang lebih rapi.</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 dark:bg-slate-800 px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400 shadow-sm">
                        {contacts.length} contact tersimpan
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <Button
                    className="rounded-2xl"
                    onClick={() => {
                        setIsCreating(true);
                        setSelectedId(null);
                    }}
                >
                    <Plus className="h-4 w-4" />
                    Kontak Baru
                </Button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 sm:gap-7 2xl:grid-cols-[380px_minmax(0,1fr)]">
                <Card className="min-h-0 overflow-hidden flex flex-col">
                    <CardHeader className="flex-shrink-0">
                        <CardTitle>Daftar Kontak</CardTitle>
                        <CardDescription>{contacts.length} contact tersimpan di database.</CardDescription>
                    </CardHeader>
                    <CardContent className="soft-scrollbar space-y-3.5 overflow-auto min-h-0 flex-1 pr-1">
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Memuat contacts...
                            </div>
                        ) : contacts.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-6 text-sm leading-relaxed text-muted-foreground">
                                Belum ada contact. Buat contact baru untuk mulai mengisi tabel.
                            </div>
                        ) : (
                            contacts.map((contact) => {
                                const active = !isCreating && selectedId === contact.id;
                                return (
                                    <button
                                        key={contact.id}
                                        type="button"
                                        onClick={() => {
                                            setIsCreating(false);
                                            setSelectedId(contact.id);
                                        }}
                                        className={`w-full rounded-[1.25rem] border p-5 text-left transition ${active ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm' : 'hover:border-emerald-100 dark:hover:border-emerald-600/30 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-foreground">{contact.id}</p>
                                                <p className="mt-1 truncate text-sm text-muted-foreground">{contact.name || 'Tanpa display name'}</p>
                                            </div>
                                            {contact.is_blocked ? (
                                                <span className="rounded-full bg-rose-100 dark:bg-rose-950/40 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                                                    Blocked
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-3.5 space-y-1 text-xs leading-relaxed text-muted-foreground">
                                            <p>Last seen: {contact.last_seen ? formatDate(contact.last_seen) : 'Belum ada'}</p>
                                            <p>Dibuat: {formatDate(contact.created_at)}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                <Card className="min-h-0 overflow-hidden flex flex-col">
                    <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between flex-shrink-0">
                        <div>
                            <CardTitle>{isCreating ? 'Buat Contact Baru' : 'Edit Contact'}</CardTitle>
                            <CardDescription>
                                {isCreating
                                    ? 'Isi data contact baru lalu simpan ke tabel contacts.'
                                    : selectedContact
                                        ? `Mengedit ${selectedContact.id}`
                                        : 'Pilih contact dari daftar untuk mulai edit.'}
                            </CardDescription>
                        </div>
                        {!isCreating && selectedContact ? (
                            <Button variant="destructive" size="sm" onClick={() => void handleDelete()} disabled={isDeleting}>
                                <Trash2 className="h-4 w-4" />
                                {isDeleting ? 'Menghapus...' : 'Hapus'}
                            </Button>
                        ) : null}
                    </CardHeader>
                    <CardContent className="soft-scrollbar space-y-6 overflow-auto min-h-0 flex-1">
                        {isCreating || selectedContact ? (
                            <>
                                <div className="rounded-[1.25rem] bg-gradient-to-r from-emerald-50 dark:from-emerald-950/30 via-white dark:via-slate-800 to-amber-50 dark:to-amber-950/30 p-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    JID, display name, status block, dan `last_seen` tetap memakai field yang sama. Perubahan di sini murni pada visual editor.
                                </div>

                                <div className="grid gap-5 lg:grid-cols-2">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="contact-jid">WhatsApp JID</Label>
                                        <Input
                                            id="contact-jid"
                                            value={form.id}
                                            onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
                                            placeholder="6281234567890@s.whatsapp.net"
                                        />
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label htmlFor="contact-name">Display Name</Label>
                                        <Input
                                            id="contact-name"
                                            value={form.name}
                                            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                            placeholder="Nama kontak"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-5 lg:grid-cols-2">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="contact-last-seen">Last Seen</Label>
                                        <Input
                                            id="contact-last-seen"
                                            type="datetime-local"
                                            value={form.last_seen}
                                            onChange={(event) => setForm((current) => ({ ...current, last_seen: event.target.value }))}
                                        />
                                    </div>

                                    <div className="rounded-[1.25rem] border bg-slate-50/90 dark:bg-slate-800/50 p-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Status Contact</p>
                                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                                    Gunakan switch ini untuk block atau unblock contact secara manual.
                                                </p>
                                            </div>
                                            <Switch
                                                checked={form.is_blocked}
                                                onCheckedChange={(checked) => setForm((current) => ({ ...current, is_blocked: checked }))}
                                                aria-label="Block contact"
                                            />
                                        </div>
                                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                            {form.is_blocked ? <ShieldBan className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> : <UserRound className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                                            {form.is_blocked ? 'Contact diblokir' : 'Contact aktif'}
                                        </div>
                                    </div>
                                </div>

                                {!isCreating && selectedContact ? (
                                    <div className="grid gap-3.5 rounded-[1.25rem] border border-dashed dark:border-dashed p-5 text-sm leading-relaxed text-muted-foreground lg:grid-cols-2">
                                        <p>Created at: {formatDate(selectedContact.created_at)}</p>
                                        <p>Updated at: {selectedContact.updated_at ? formatDate(selectedContact.updated_at) : 'Tidak tersedia'}</p>
                                    </div>
                                ) : null}

                                <div className="flex flex-wrap gap-3">
                                    <Button onClick={() => void handleSave()} disabled={isSaving}>
                                        <Save className="h-4 w-4" />
                                        {isSaving ? 'Menyimpan...' : isCreating ? 'Simpan Contact' : 'Update Contact'}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsCreating(false);
                                            setForm(selectedContact ? toFormState(selectedContact) : EMPTY_FORM);
                                        }}
                                        disabled={isSaving}
                                    >
                                        Batal
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="rounded-[1.25rem] border border-dashed p-8 text-center text-sm leading-relaxed text-muted-foreground">
                                Pilih contact dari daftar di kiri atau buat contact baru untuk mulai edit.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function toFormState(contact: Contact): ContactFormState {
    return {
        id: contact.id,
        name: contact.name ?? '',
        is_blocked: contact.is_blocked,
        last_seen: contact.last_seen ? toDatetimeLocalValue(contact.last_seen) : ''
    };
}

function toDatetimeLocalValue(value: string): string {
    const date = new Date(value);
    const offsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function sortContacts(a: Contact, b: Contact): number {
    const aTime = a.last_seen ? Date.parse(a.last_seen) : 0;
    const bTime = b.last_seen ? Date.parse(b.last_seen) : 0;
    return bTime - aTime || Date.parse(b.created_at) - Date.parse(a.created_at);
}
