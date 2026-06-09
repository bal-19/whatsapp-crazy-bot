import { Loader2, Save, Search, Trash2, BookOpen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { KnowledgeItem } from '@whatsapp-bot/shared';
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
    Label,
    Textarea,
} from '@/components/ui';
import { knowledgeService } from '@/lib/services/knowledgeService';
import { formatDate } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

interface KnowledgeFormState {
    id?: string;
    title: string;
    question: string;
    answer: string;
    tags: string;
    is_active: boolean;
}

const EMPTY_FORM: KnowledgeFormState = {
    title: '',
    question: '',
    answer: '',
    tags: '',
    is_active: true,
};

export function KnowledgePage() {
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [form, setForm] = useState<KnowledgeFormState>(EMPTY_FORM);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const addToast = useUIStore((state) => state.addToast);

    const selectedItem = useMemo(
        () => items.find((item) => item.id === form.id) ?? null,
        [items, form.id],
    );

    const filteredItems = useMemo(
        () =>
            items.filter((item) =>
                `${item.title} ${item.question} ${item.answer} ${item.tags.join(' ')}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
            ),
        [items, query],
    );

    useEffect(() => {
        void loadItems();
    }, []);

    async function loadItems() {
        setIsLoading(true);
        try {
            setItems(await knowledgeService.getAll());
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        if (!form.title.trim() || !form.question.trim() || !form.answer.trim()) {
            addToast({ type: 'warning', message: 'Title, pertanyaan, dan jawaban wajib diisi.' });
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                title: form.title.trim(),
                question: form.question.trim(),
                answer: form.answer.trim(),
                tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
                is_active: form.is_active,
            };

            const saved = form.id
                ? await knowledgeService.update(form.id, payload)
                : await knowledgeService.create(payload);

            setItems((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
            setForm({
                id: saved.id,
                title: saved.title,
                question: saved.question,
                answer: saved.answer,
                tags: saved.tags.join(', '),
                is_active: saved.is_active,
            });
            addToast({
                type: 'success',
                message: form.id
                    ? 'Knowledge item berhasil diperbarui.'
                    : 'Knowledge item berhasil ditambahkan.',
            });
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!selectedItem) return;

        setIsDeleting(true);
        try {
            await knowledgeService.remove(selectedItem.id);
            setItems((current) => current.filter((item) => item.id !== selectedItem.id));
            setForm(EMPTY_FORM);
            setIsDeleteDialogOpen(false);
            addToast({ type: 'success', message: 'Knowledge item berhasil dihapus.' });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="flex h-full flex-col gap-6 sm:gap-7">
            <Card className="mesh-card">
                <CardContent className="flex flex-wrap items-end justify-between gap-5 p-6 sm:p-7 lg:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Grounded Replies</p>
                        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Knowledge Base</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                            Simpan FAQ, SOP, harga, atau katalog singkat agar jawaban bot lebih grounded ke informasi bisnis.
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-5 py-3.5 text-sm text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-400">
                        {items.length} item tersimpan
                    </div>
                </CardContent>
            </Card>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 sm:gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
                <Card className="min-h-0 overflow-hidden">
                    <CardHeader>
                        <CardTitle>Daftar Knowledge</CardTitle>
                        <CardDescription>Pilih item untuk edit atau cari berdasarkan title, pertanyaan, jawaban, dan tag.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-col gap-4">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
                            <Input
                                className="pl-10"
                                placeholder="Cari knowledge"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </div>

                        <div className="soft-scrollbar min-h-0 flex-1 space-y-3 overflow-auto pr-1">
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Memuat knowledge...
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="rounded-xl border border-dashed p-6 text-sm leading-relaxed text-muted-foreground">
                                    Belum ada knowledge item. Tambahkan FAQ bisnis pertama dari panel kanan.
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() =>
                                            setForm({
                                                id: item.id,
                                                title: item.title,
                                                question: item.question,
                                                answer: item.answer,
                                                tags: item.tags.join(', '),
                                                is_active: item.is_active,
                                            })
                                        }
                                        className="w-full rounded-[1.25rem] border border-white/70 bg-white/80 p-4 text-left shadow-sm transition hover:border-emerald-100 hover:bg-emerald-50/70 dark:border-slate-700/50 dark:bg-slate-800 dark:hover:border-emerald-600/30 dark:hover:bg-emerald-950/40"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                <BookOpen className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                        {item.is_active ? 'active' : 'inactive'}
                                                    </span>
                                                </div>
                                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.question}</p>
                                                <p className="mt-2 text-[11px] text-muted-foreground/80">
                                                    Tag: {item.tags.length > 0 ? item.tags.join(', ') : '-'} • Update: {formatDate(item.updated_at)}
                                                </p>
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
                        <CardTitle>{form.id ? 'Edit Knowledge' : 'Tambah Knowledge'}</CardTitle>
                        <CardDescription>Pakai format singkat dan jelas supaya mudah diretrieval ke prompt.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2.5">
                            <Label htmlFor="knowledge-title">Title</Label>
                            <Input
                                id="knowledge-title"
                                value={form.title}
                                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                placeholder="Jam operasional toko"
                            />
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="knowledge-question">Pertanyaan / topik</Label>
                            <Textarea
                                id="knowledge-question"
                                value={form.question}
                                onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))}
                                placeholder="Kapan toko buka dan tutup?"
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="knowledge-answer">Jawaban bisnis</Label>
                            <Textarea
                                id="knowledge-answer"
                                value={form.answer}
                                onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))}
                                placeholder="Toko buka setiap hari Senin-Sabtu pukul 08.00-21.00 WIB."
                                rows={6}
                            />
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="knowledge-tags">Tags</Label>
                            <Input
                                id="knowledge-tags"
                                value={form.tags}
                                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                                placeholder="jam operasional, toko, buka"
                            />
                        </div>

                        <label className="flex items-center gap-3 rounded-[1.25rem] border border-white/70 bg-white/70 p-4 text-sm dark:border-slate-700/50 dark:bg-slate-800/60">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                            />
                            Item aktif bisa ikut masuk ke prompt retrieval.
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => void handleSave()} disabled={isSaving}>
                                <Save className="h-4 w-4" />
                                {isSaving ? 'Menyimpan...' : form.id ? 'Update Knowledge' : 'Simpan Knowledge'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setForm(EMPTY_FORM)}>
                                Reset Form
                            </Button>
                            {selectedItem ? (
                                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="destructive" disabled={isDeleting}>
                                            <Trash2 className="h-4 w-4" />
                                            {isDeleting ? 'Menghapus...' : 'Hapus'}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus knowledge item ini?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Item `{selectedItem.title}` akan dihapus dari knowledge base dan tidak lagi dipakai untuk grounding jawaban.
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
