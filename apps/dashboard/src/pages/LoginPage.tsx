import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { authService } from '../lib/services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Masuk Dashboard</CardTitle>
              <p className="text-sm text-slate-500">Kelola bot WhatsApp dari satu tempat.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-500">Username</span>
              <Input className="mt-2" value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-500">Password</span>
              <Input className="mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Masuk...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
