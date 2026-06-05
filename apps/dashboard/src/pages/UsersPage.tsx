import { useEffect, useMemo, useState } from 'react';
import type { CreateUserRequest, UpdateUserRequest, Role, User } from '@whatsapp-bot/shared';
import { Plus, Trash2, Users } from 'lucide-react';
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
    Switch
} from '@/components/ui';
import { roleService } from '@/lib/services/roleService';
import { userService } from '@/lib/services/userService';
import { formatDate } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

interface UserFormState {
    id: string;
    username: string;
    password: string;
    email: string;
    role_id: string;
    is_active: boolean;
}

const EMPTY_FORM: UserFormState = {
    id: '',
    username: '',
    password: '',
    email: '',
    role_id: '',
    is_active: true
};

export function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const addToast = useUIStore((state) => state.addToast);

    const selectedUser = useMemo(
        () => users.find((user) => user.id === form.id) ?? null,
        [users, form.id]
    );

    useEffect(() => {
        void loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const [nextUsers, nextRoles] = await Promise.all([
                userService.getAll(),
                roleService.getAll()
            ]);
            setUsers(nextUsers);
            setRoles(nextRoles);
            if (!form.id && nextUsers[0]) {
                setForm(mapUserToForm(nextUsers[0]));
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        if (!form.username.trim()) {
            addToast({ type: 'warning', message: 'Username wajib diisi.' });
            return;
        }

        if (!selectedUser && form.password.trim().length < 6) {
            addToast({ type: 'warning', message: 'Password minimal 6 karakter.' });
            return;
        }

        setIsSaving(true);
        try {
            if (selectedUser) {
                const payload: UpdateUserRequest = {
                    email: form.email.trim() || null,
                    role_id: form.role_id || null,
                    is_active: form.is_active,
                    password: form.password.trim() || undefined
                };
                const updated = await userService.update(selectedUser.id, payload);
                setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                setForm(mapUserToForm(updated));
                addToast({ type: 'success', message: 'User berhasil diupdate.' });
                return;
            }

            const payload: CreateUserRequest = {
                username: form.username.trim(),
                password: form.password.trim(),
                email: form.email.trim() || null,
                role_id: form.role_id || null,
                is_active: form.is_active
            };
            const created = await userService.create(payload);
            setUsers((current) => [created, ...current]);
            setForm(mapUserToForm(created));
            addToast({ type: 'success', message: 'User berhasil dibuat.' });
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!selectedUser) return;

        setIsDeleting(true);
        try {
            await userService.remove(selectedUser.id);
            const remaining = users.filter((user) => user.id !== selectedUser.id);
            setUsers(remaining);
            setForm(remaining[0] ? mapUserToForm(remaining[0]) : EMPTY_FORM);
            setIsDeleteDialogOpen(false);
            addToast({ type: 'success', message: 'User berhasil dihapus.' });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="flex h-full flex-col gap-6 sm:gap-7">
            <Card className="mesh-card">
                <CardContent className="flex flex-wrap items-end justify-between gap-5 p-6 sm:p-7 lg:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Access Control</p>
                        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Users</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                            Buat user dashboard, hubungkan ke role, lalu tentukan akun mana yang aktif.
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-5 py-3.5 text-sm text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-400">
                        {users.length} user tersimpan
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <Button
                    className="rounded-2xl"
                    onClick={() => setForm(EMPTY_FORM)}
                >
                    <Plus className="h-4 w-4" />
                    Buat User Baru
                </Button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 sm:gap-7 xl:grid-cols-[360px_minmax(0,1fr)]">
                <Card className="min-h-0 overflow-hidden">
                    <CardHeader>
                        <CardTitle>Daftar User</CardTitle>
                        <CardDescription>Pilih user untuk diedit atau buat akun baru.</CardDescription>
                    </CardHeader>
                    <CardContent className="soft-scrollbar min-h-0 flex-1 space-y-3 overflow-auto pr-1">
                        {isLoading ? (
                            <p className="text-sm text-muted-foreground">Memuat users...</p>
                        ) : users.length === 0 ? (
                            <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Belum ada user.</p>
                        ) : (
                            users.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => setForm(mapUserToForm(user))}
                                    className="w-full rounded-[1.25rem] border border-white/70 bg-white/80 p-4 text-left shadow-sm transition hover:border-emerald-100 hover:bg-emerald-50/70 dark:border-slate-700/50 dark:bg-slate-800 dark:hover:border-emerald-600/30 dark:hover:bg-emerald-950/40"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-foreground">{user.username}</p>
                                            <p className="mt-1 truncate text-xs text-muted-foreground">{user.role_name || 'Tanpa role'}</p>
                                            <p className="mt-1 text-[11px] text-muted-foreground/80">Login terakhir: {user.last_login_at ? formatDate(user.last_login_at) : 'Belum pernah'}</p>
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
                            <CardTitle>{selectedUser ? 'Edit User' : 'Buat User Baru'}</CardTitle>
                            <CardDescription>Role menentukan halaman dan fitur dashboard yang boleh diakses.</CardDescription>
                        </div>
                        {selectedUser ? (
                            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                                        <Trash2 className="h-4 w-4" />
                                        {isDeleting ? 'Menghapus...' : 'Hapus'}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus user ini?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Akun ini akan kehilangan akses dashboard secara permanen.
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
                    <CardContent className="soft-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
                        <div className="grid gap-5 lg:grid-cols-2">
                            <div className="space-y-2.5">
                                <Label htmlFor="user-username">Username</Label>
                                <Input
                                    id="user-username"
                                    value={form.username}
                                    disabled={Boolean(selectedUser)}
                                    onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                                    placeholder="username"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label htmlFor="user-email">Email</Label>
                                <Input
                                    id="user-email"
                                    value={form.email}
                                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                                    placeholder="user@domain.com"
                                />
                            </div>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                            <div className="space-y-2.5">
                                <Label htmlFor="user-password">{selectedUser ? 'Password Baru' : 'Password'}</Label>
                                <Input
                                    id="user-password"
                                    type="password"
                                    value={form.password}
                                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                                    placeholder={selectedUser ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label htmlFor="user-role">Role</Label>
                                <select
                                    id="user-role"
                                    className="flex h-10 w-full rounded-2xl border border-input bg-background/90 px-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-slate-800"
                                    value={form.role_id}
                                    onChange={(event) => setForm((current) => ({ ...current, role_id: event.target.value }))}
                                >
                                    <option value="">Tanpa role</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-input/70 bg-background/70 px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-foreground">Akun aktif</p>
                                <p className="text-xs text-muted-foreground">User nonaktif tidak bisa login ke dashboard.</p>
                            </div>
                            <Switch
                                checked={form.is_active}
                                onCheckedChange={(checked) => setForm((current) => ({ ...current, is_active: checked }))}
                            />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => void handleSave()} disabled={isSaving}>
                                {isSaving ? 'Menyimpan...' : selectedUser ? 'Update User' : 'Buat User'}
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

function mapUserToForm(user: User): UserFormState {
    return {
        id: user.id,
        username: user.username,
        password: '',
        email: user.email ?? '',
        role_id: user.role_id ?? '',
        is_active: user.is_active
    };
}
