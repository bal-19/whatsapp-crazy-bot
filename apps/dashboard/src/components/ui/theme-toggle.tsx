import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from './dropdown-menu';
import { useUIStore, type Theme } from '@/stores/uiStore';

export function ThemeToggle() {
    const { theme, setTheme } = useUIStore();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    aria-label="Toggle theme"
                    className="rounded-lg h-10 w-10 bg-white/80 dark:bg-slate-950/80"
                >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 z-30">
                <DropdownMenuCheckboxItem
                    checked={theme === 'light'}
                    onCheckedChange={() => setTheme('light')}
                    className="cursor-pointer flex items-center gap-2"
                >
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={theme === 'dark'}
                    onCheckedChange={() => setTheme('dark')}
                    className="cursor-pointer flex items-center gap-2"
                >
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={theme === 'system'}
                    onCheckedChange={() => setTheme('system')}
                    className="cursor-pointer flex items-center gap-2"
                >
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
