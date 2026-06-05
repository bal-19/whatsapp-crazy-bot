import { Loader2, Save, Search, Trash2, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { WhatsAppGroup } from '@whatsapp-bot/shared';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Input,
    Label
} from '@/components/ui';
import { groupService } from '@/lib/services/groupService';
import { formatDate } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

interface GroupFormState {
    group_jid: string;
    display_name: string;
}

const EMPTY_FORM: GroupFormState = {
    group_jid: '',
    display_name: ''
};

export function GroupsPage() {
    const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
    const [form, setForm] = useState<GroupFormState>(EMPTY_FORM);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const addToast = useUIStore((state) => state.addToast);

    const selectedGroup = useMemo(
        () => groups.find((group) => group.group_jid === form.group_jid.trim()) ?? null,
        [groups, form.group_jid]
    );

    const filteredGroups = useMemo(
        () =>
            groups.filter((group) =>
                `${group.group_jid} ${group.display_name ?? ''}`
                    .toLowerCase()
                    .includes(query.toLowerCase())
            ),
        [groups, query]
    );

    useEffect(() => {
        void loadGroups();
    }, []);

    async function loadGroups() {
        setIsLoading(true);
        try {
            setGroups(await groupService.getAll());
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        const groupJid = form.group_jid.trim();
        const displayName = form.display_name.trim();

        if (!groupJid) {
            addToast({ type: 'warning', message: 'Group JID wajib diisi.' });
            return;
        }

        if (!groupJid.endsWith('@g.us')) {
            addToast({ type: 'warning', message: 'Group JID harus berakhiran @g.us.' });
            return;
        }

        setIsSaving(true);
        try {
            const saved = await groupService.save({
                group_jid: groupJid,
                display_name: displayName || null
            });
            setGroups((current) => [saved, ...current.filter((group) => group.group_jid !== saved.group_jid)]);
            setForm({ group_jid: saved.group_jid, display_name: saved.display_name ?? '' });
            addToast({ type: 'success', message: 'Nama grup berhasil disimpan.' });
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!selectedGroup) return;

        setIsDeleting(true);
        try {
            await groupService.remove(selectedGroup.group_jid);
            setGroups((current) => current.filter((group) => group.group_jid !== selectedGroup.group_jid));
            setForm(EMPTY_FORM);
            setIsDeleteDialogOpen(false);
            addToast({ type: 'success', message: 'Metadata grup berhasil dihapus.' });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="flex h-full flex-col gap-6 sm:gap-7">
            <Card className="mesh-card">
                <CardContent className="flex flex-wrap items-end justify-between gap-5 p-6 sm:p-7 lg:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Group Metadata</p>
                        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">WhatsApp Groups</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                            Simpan nama grup berdasarkan JID agar subtitle percakapan grup tampil sebagai nama manusiawi, bukan angka panjang.
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-5 py-3.5 text-sm text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-400">
                        {groups.length} grup tersimpan
                    </div>
                </CardContent>
            </Card>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 sm:gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
                <Card className="min-h-0 overflow-hidden">
                    <CardHeader>
                        <CardTitle>Daftar Grup</CardTitle>
                        <CardDescription>Pilih grup untuk mengisi ulang form, atau cari berdasarkan JID/nama.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-col gap-4">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
                            <Input
                                className="pl-10"
                                placeholder="Cari nama grup atau JID"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </div>

                        <div className="soft-scrollbar min-h-0 flex-1 space-y-3 overflow-auto pr-1">
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Memuat grup...
                                </div>
                            ) : filteredGroups.length === 0 ? (
                                <div className="rounded-xl border border-dashed p-6 text-sm leading-relaxed text-muted-foreground">
                                    Belum ada metadata grup. Simpan JID grup dari panel kanan untuk mulai.
                                </div>
                            ) : (
                                filteredGroups.map((group) => (
                                    <button
                                        key={group.group_jid}
                                        type="button"
                                        onClick={() =>
                                            setForm({
                                                group_jid: group.group_jid,
                                                display_name: group.display_name ?? ''
                                            })
                                        }
                                        className="w-full rounded-[1.25rem] border border-white/70 bg-white/80 p-4 text-left shadow-sm transition hover:border-emerald-100 hover:bg-emerald-50/70 dark:border-slate-700/50 dark:bg-slate-800 dark:hover:border-emerald-600/30 dark:hover:bg-emerald-950/40"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                <UsersRound className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {group.display_name || 'Tanpa nama grup'}
                                                </p>
                                                <p className="mt-1 truncate text-xs text-muted-foreground">{group.group_jid}</p>
                                                <p className="mt-2 text-[11px] text-muted-foreground/80">Update: {formatDate(group.updated_at)}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Simpan Nama Grup</CardTitle>
                        <CardDescription>Gunakan JID lengkap, contoh `120363301153712103@g.us`.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="rounded-[1.25rem] bg-gradient-to-r from-emerald-50 via-white to-amber-50 p-5 text-sm leading-relaxed text-slate-600 dark:from-emerald-950/30 dark:via-slate-800 dark:to-amber-950/30 dark:text-slate-400">
                            Data ini mengisi kolom `group_name` di daftar percakapan. Nama member tetap berasal dari `contacts.display_name`.
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="group-jid">Group JID</Label>
                            <Input
                                id="group-jid"
                                value={form.group_jid}
                                onChange={(event) => setForm((current) => ({ ...current, group_jid: event.target.value }))}
                                placeholder="120363301153712103@g.us"
                            />
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="group-name">Nama Grup</Label>
                            <Input
                                id="group-name"
                                value={form.display_name}
                                onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))}
                                placeholder="Nama grup WhatsApp"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => void handleSave()} disabled={isSaving}>
                                <Save className="h-4 w-4" />
                                {isSaving ? 'Menyimpan...' : 'Simpan Grup'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setForm(EMPTY_FORM)}>
                                Reset Form
                            </Button>
                            {selectedGroup ? (
                                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="destructive" disabled={isDeleting}>
                                            <Trash2 className="h-4 w-4" />
                                            {isDeleting ? 'Menghapus...' : 'Hapus Grup'}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus metadata grup ini?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Nama grup untuk `{selectedGroup.group_jid}` akan dihapus dari dashboard. History percakapan tetap ada, tapi subtitle akan fallback ke nomor/JID grup.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    void handleDelete();
                                                }}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? 'Menghapus...' : 'Ya, hapus'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
