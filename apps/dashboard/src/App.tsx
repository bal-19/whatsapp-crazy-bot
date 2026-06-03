import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ConversationsPage } from './pages/ConversationsPage';
import { ConfigPage } from './pages/ConfigPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { LogsPage } from './pages/LogsPage';
import { Toaster } from './components/ui/toaster';

export function App() {
    return (
        <>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/conversations" element={<ConversationsPage />} />
                    <Route path="/config" element={<ConfigPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/logs" element={<LogsPage />} />
                </Route>
            </Routes>
            <Toaster />
        </>
    );
}

function ProtectedLayout() {
    const token = localStorage.getItem('auth_token');
    if (!token) return <Navigate to="/login" replace />;
    return <AppShell />;
}
