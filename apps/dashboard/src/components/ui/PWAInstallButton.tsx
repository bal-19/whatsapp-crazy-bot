import React, { useState } from "react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "./button";
import { Download } from "lucide-react";

export const PWAInstallButton: React.FC = () => {
    const { isInstallable, isStandalone, installPWA } = usePWA();
    const [isInstalling, setIsInstalling] = useState(false);

    // Jangan tampilkan button jika sudah dalam mode standalone
    if (isStandalone || !isInstallable) {
        return null;
    }

    const handleClick = async () => {
        setIsInstalling(true);
        try {
            const success = await installPWA();
            if (success) {
                console.log("PWA berhasil diinstall");
            }
        } catch (error) {
            console.error("Error installing PWA:", error);
        } finally {
            setIsInstalling(false);
        }
    };

    return (
        <Button
            onClick={handleClick}
            disabled={isInstalling}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            title="Install aplikasi di perangkat Anda"
        >
            <Download size={16} />
            {isInstalling ? "Menginstall..." : "Install"}
        </Button>
    );
};
