import { useEffect, useMemo, useState } from 'react';
import type { DashboardPermission, Role } from '@whatsapp-bot/shared';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
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
import { dashboardPermissions } from '@/lib/permissions';
import { roleService } from '@/lib/services/roleService';
import { useUIStore } from '@/stores/uiStore';

const EMPTY_FORM = {
    id: '',
    name: '',
    permissions: [] as DashboardPermission[]
};

export function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const addToast = useUIStore((state) => state.addToast);

    const selectedRole = useMemo(
        () => roles.find((role) => role.id === form.id) ?? null,
        [roles, form.id]
    );

    useEffect(() => {
        void loadRoles();
    }, []);

    async function loadRoles() {
        setIsLoading(true);
        try {
            const data = await roleService.getAll();
            setRoles(data);
            if (!form.id && data[0]) {
                setForm({
                    id: data[0].id,
                    name: data[0].name,
                    permissions: data[0].permissions
                });
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        const name = form.name.trim();
        if (!name) {
            addToast({ type: 'warning', message: 'Nama role wajib diisi.' });
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name,
                permissions: form.permissions
            };

            if (selectedRole) {
                const updated = await roleService.update(selectedRole.id, payload);
                setRoles((current) => current.map((role) => (role.id === updated.id ? updated : role)));
                setForm({ id: updated.id, name: updated.name, permissions: updated.permissions });
                addToast({ type: 'success', message: 'Role berhasil diupdate.' });
                return;
            }

            const created = await roleService.create(payload);
            setRoles((current) => [created, ...current]);
            setForm({ id: created.id, name: created.name, permissions: created.permissions });
            addToast({ type: 'success', message: 'Role berhasil dibuat.' });
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!selectedRole) return;

        setIsDeleting(true);
        try {
            await roleService.remove(selectedRole.id);
            const remaining = roles.filter((role) => role.id !== selectedRole.id);
            setRoles(remaining);
            setForm(
                remaining[0]
                    ? { id: remaining[0].id, name: remaining[0].name, permissions: remaining[0].permissions }
                    : EMPTY_FORM
            );
            setIsDeleteDialogOpen(false);
            addToast({ type: 'success', message: 'Role berhasil dihapus.' });
        } finally {
            setIsDeleting(false);
        }
    }

    function togglePermission(permission: DashboardPermission) {
        setForm((current) => ({
            ...current,
            permissions: current.permissions.includes(permission)
                ? current.permissions.filter((item) => item !== permission)
                : [...current.permissions, permission]
        }));
    }

    return (
        <div className="flex h-full flex-col gap-6 sm:gap-7">
            <Card className="mesh-card">
                <CardContent className="flex flex-wrap items-end justify-between gap-5 p-6 sm:p-7 lg:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Access Control</p>
                        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Roles</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                            Atur nama role dan permission dashboard yang boleh diakses oleh user.
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-5 py-3.5 text-sm text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-400">
                        {roles.length} role tersimpan
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <Button
                    className="rounded-2xl"
                    onClick={() => setForm(EMPTY_FORM)}
                >
                    <Plus className="h-4 w-4" />
                    Buat Role Baru
                </Button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 sm:gap-7 xl:grid-cols-[360px_minmax(0,1fr)]">
                <Card className="min-h-0 overflow-hidden">
                    <CardHeader>
                        <CardTitle>Daftar Role</CardTitle>
                        <CardDescription>Pilih role untuk diedit atau buat role baru.</CardDescription>
                    </CardHeader>
                    <CardContent className="soft-scrollbar min-h-0 flex-1 space-y-3 overflow-auto pr-1">
                        {isLoading ? (
                            <p className="text-sm text-muted-foreground">Memuat roles...</p>
                        ) : roles.length === 0 ? (
                            <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Belum ada role.</p>
                        ) : (
                            roles.map((role) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => setForm({ id: role.id, name: role.name, permissions: role.permissions })}
                                    className="w-full rounded-[1.25rem] border border-white/70 bg-white/80 p-4 text-left shadow-sm transition hover:border-emerald-100 hover:bg-emerald-50/70 dark:border-slate-700/50 dark:bg-slate-800 dark:hover:border-emerald-600/30 dark:hover:bg-emerald-950/40"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-foreground">{role.name}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{role.permissions.length} permission</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card className="min-h-0 overflow-hidden flex flex-col">
                    <CardHeader className="flex flex-col gap-4 space-y-0 flex-shrink-0 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <CardTitle>{selectedRole ? 'Edit Role' : 'Buat Role Baru'}</CardTitle>
                            <CardDescription>Permission bertanda centang akan membuka halaman atau fitur terkait.</CardDescription>
                        </div>
                        {selectedRole ? (
                            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                                        <Trash2 className="h-4 w-4" />
                                        {isDeleting ? 'Menghapus...' : 'Hapus'}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus role ini?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            User yang memakai role ini akan kehilangan relasi role dan perlu dipasangkan ulang.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                                        <AlertDialogAction
                                            disabled={isDeleting}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                void handleDelete();
                                            }}
                                        >
                                            {isDeleting ? 'Menghapus...' : 'Ya, hapus'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : null}
                    </CardHeader>
                    <CardContent className="soft-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
                        <div className="space-y-2.5">
                            <Label htmlFor="role-name">Nama Role</Label>
                            <Input
                                id="role-name"
                                value={form.name}
                                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                placeholder="Misal: Operator, Support, Admin"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Permissions</Label>
                            <div className="grid gap-3 md:grid-cols-2">
                                {dashboardPermissions.map((permission) => (
                                    <label key={permission} className="flex items-center gap-3 rounded-2xl border border-input/70 bg-background/70 px-4 py-3 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={form.permissions.includes(permission)}
                                            onChange={() => togglePermission(permission)}
                                        />
                                        <span>{permission}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => void handleSave()} disabled={isSaving}>
                                {isSaving ? 'Menyimpan...' : selectedRole ? 'Update Role' : 'Buat Role'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setForm(EMPTY_FORM)}>
                                Reset Form
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
