import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import type { DashboardPermission } from '@whatsapp-bot/shared';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ConversationsPage } from '@/pages/ConversationsPage';
import { ContactsPage } from '@/pages/ContactsPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { ConfigPage } from '@/pages/ConfigPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { LogsPage } from '@/pages/LogsPage';
import { UsersPage } from '@/pages/UsersPage';
import { RolesPage } from '@/pages/RolesPage';
import { Toaster } from '@/components/ui/toaster';
import { PWAStatusIndicator } from '@/components/ui/PWAStatusIndicator';
import { useAuthStore } from '@/stores/authStore';
import { firstAccessibleRoute } from '@/lib/permissions';

export function App() {
    return (
        <>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<RequirePermission permission="dashboard.view"><DashboardPage /></RequirePermission>} />
                    <Route path="/conversations" element={<RequirePermission permission="conversations.view"><ConversationsPage /></RequirePermission>} />
                    <Route path="/contacts" element={<RequirePermission permission="contacts.manage"><ContactsPage /></RequirePermission>} />
                    <Route path="/groups" element={<RequirePermission permission="groups.manage"><GroupsPage /></RequirePermission>} />
                    <Route path="/config" element={<RequirePermission permission="config.manage"><ConfigPage /></RequirePermission>} />
                    <Route path="/analytics" element={<RequirePermission permission="analytics.view"><AnalyticsPage /></RequirePermission>} />
                    <Route path="/logs" element={<RequirePermission permission="logs.view"><LogsPage /></RequirePermission>} />
                    <Route path="/users" element={<RequirePermission permission="users.manage"><UsersPage /></RequirePermission>} />
                    <Route path="/roles" element={<RequirePermission permission="roles.manage"><RolesPage /></RequirePermission>} />
                </Route>
            </Routes>
            <Toaster />
            <PWAStatusIndicator />
        </>
    );
}

function ProtectedLayout() {
    const token = useAuthStore((state) => state.token);
    const hydrate = useAuthStore((state) => state.hydrate);
    const isLoading = useAuthStore((state) => state.isLoading);

    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    if (!token) return <Navigate to="/login" replace />;
    if (isLoading) return <div className="min-h-screen bg-background" />;
    return <AppShell />;
}

function RequirePermission(props: { permission: DashboardPermission; children: JSX.Element }) {
    const user = useAuthStore((state) => state.user);
    const hasPermission = useAuthStore((state) => state.hasPermission);

    if (!user) return <Navigate to="/login" replace />;
    if (hasPermission(props.permission)) return props.children;
    return <Navigate to={firstAccessibleRoute(user.permissions)} replace />;
}
