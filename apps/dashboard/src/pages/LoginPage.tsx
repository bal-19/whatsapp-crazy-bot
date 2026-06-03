import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { authService } from '../lib/services/authService';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription, Label } from '../components/ui';

export function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setIsLoading(true);
        try {
            const response = await authService.login({ username, password });
            localStorage.setItem('auth_token', response.token);
            navigate('/');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle>Masuk Dashboard</CardTitle>
                            <CardDescription>Kelola bot WhatsApp dari satu tempat.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? 'Masuk...' : 'Masuk'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
