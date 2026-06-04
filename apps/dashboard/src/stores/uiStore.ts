import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

export interface Toast {
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
}

interface UIStore {
    sidebarOpen: boolean;
    toasts: Toast[];
    theme: Theme;
    toggleSidebar: () => void;
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

export const useUIStore = create<UIStore>()(
    persist(
        (set) => ({
            sidebarOpen: true,
            toasts: [],
            theme: "system",
            toggleSidebar: () =>
                set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            addToast: (toast) => {
                const id = crypto.randomUUID();
                set((state) => ({
                    toasts: [...state.toasts, { ...toast, id }].slice(-5),
                }));
                window.setTimeout(
                    () => useUIStore.getState().removeToast(id),
                    3500,
                );
            },
            removeToast: (id) =>
                set((state) => ({
                    toasts: state.toasts.filter((toast) => toast.id !== id),
                })),
            setTheme: (theme) => {
                set({ theme });
                applyTheme(theme);
            },
            toggleTheme: () => {
                set((state) => {
                    const themes: Theme[] = ["light", "dark", "system"];
                    const nextTheme =
                        themes[
                            (themes.indexOf(state.theme) + 1) % themes.length
                        ];
                    applyTheme(nextTheme);
                    return { theme: nextTheme };
                });
            },
        }),
        {
            name: "ui-store",
            partialize: (state) => ({
                theme: state.theme,
                sidebarOpen: state.sidebarOpen,
            }),
        },
    ),
);

function applyTheme(theme: Theme) {
    const root = document.documentElement;

    if (theme === "system") {
        const isDark = window.matchMedia(
            "(prefers-color-scheme: dark)",
        ).matches;
        root.classList.toggle("dark", isDark);
    } else {
        root.classList.toggle("dark", theme === "dark");
    }

    // Listen for system theme changes when set to 'system'
    if (theme === "system") {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e: MediaQueryListEvent) => {
            root.classList.toggle("dark", e.matches);
        };
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }
}

// Apply theme on store initialization
if (typeof window !== "undefined") {
    const theme = useUIStore.getState().theme;
    applyTheme(theme);
}
