import { useEffect, useState, useCallback } from "react";
import {
    initializePWA,
    canInstallPWA,
    installPWA as performInstall,
    isRunningStandalone,
    onServiceWorkerUpdate,
} from "@/lib/pwa";

export interface UsePWAReturn {
    isInstallable: boolean;
    isStandalone: boolean;
    isOnline: boolean;
    installPWA: () => Promise<boolean>;
    hasUpdate: boolean;
}

/**
 * Hook untuk mengelola PWA functionality
 */
export function usePWA(): UsePWAReturn {
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [hasUpdate, setHasUpdate] = useState(false);

    useEffect(() => {
        // Inisialisasi PWA
        initializePWA();
        setIsStandalone(isRunningStandalone());
        setIsInstallable(canInstallPWA());

        // Listen untuk online/offline status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Listen untuk service worker update
        const unsubscribe = onServiceWorkerUpdate(() => {
            setHasUpdate(true);
        });

        // Update installable status setiap 5 detik
        const interval = setInterval(() => {
            setIsInstallable(canInstallPWA());
        }, 5000);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const installPWA = useCallback(async () => {
        return await performInstall();
    }, []);

    return {
        isInstallable,
        isStandalone,
        isOnline,
        installPWA,
        hasUpdate,
    };
}
