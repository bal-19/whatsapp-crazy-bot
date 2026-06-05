/**
 * PWA Utilities untuk mengelola service worker dan installasi
 */

export interface PWAInstallPrompt extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: PWAInstallPrompt | null = null;
let isInstallable = false;

/**
 * Inisialisasi PWA dan listen untuk install prompt
 */
export function initializePWA() {
    if (!("serviceWorker" in navigator)) {
        console.log("Service Workers tidak didukung di browser ini");
        return;
    }

    // Handle install prompt
    window.addEventListener("beforeinstallprompt", (e: Event) => {
        e.preventDefault();
        deferredPrompt = e as PWAInstallPrompt;
        isInstallable = true;
        console.log("PWA dapat diinstall");
    });

    // Handle installed app
    window.addEventListener("appinstalled", () => {
        console.log("PWA telah diinstall");
        deferredPrompt = null;
        isInstallable = false;
    });

    // Check if already running as standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
        console.log("Aplikasi berjalan dalam mode standalone");
    }
}

/**
 * Dapatkan deferred install prompt
 */
export function getInstallPrompt(): PWAInstallPrompt | null {
    return deferredPrompt;
}

/**
 * Check apakah PWA dapat diinstall
 */
export function canInstallPWA(): boolean {
    return isInstallable;
}

/**
 * Trigger install prompt
 */
export async function installPWA(): Promise<boolean> {
    if (!deferredPrompt) {
        console.log("Install prompt belum tersedia");
        return false;
    }

    try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            console.log("Pengguna menerima install");
            deferredPrompt = null;
            return true;
        } else {
            console.log("Pengguna menolak install");
            return false;
        }
    } catch (error) {
        console.error("Error saat install:", error);
        return false;
    }
}

/**
 * Check jika aplikasi sedang berjalan dalam mode standalone
 */
export function isRunningStandalone(): boolean {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
    );
}

/**
 * Unregister semua service workers
 */
export async function unregisterServiceWorkers(): Promise<void> {
    if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
        }
    }
}

/**
 * Update service worker
 */
export async function updateServiceWorker(): Promise<void> {
    if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.update();
        }
    }
}

/**
 * Listen untuk update pada service worker
 */
export function onServiceWorkerUpdate(callback: () => void): () => void {
    if (!("serviceWorker" in navigator)) {
        return () => {};
    }

    const handleControllerChange = () => {
        callback();
    };

    navigator.serviceWorker.addEventListener(
        "controllerchange",
        handleControllerChange,
    );

    return () => {
        navigator.serviceWorker.removeEventListener(
            "controllerchange",
            handleControllerChange,
        );
    };
}
