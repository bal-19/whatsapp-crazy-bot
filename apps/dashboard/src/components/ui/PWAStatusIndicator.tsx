import React from "react";
import { usePWA } from "@/hooks/usePWA";
import { AlertCircle, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "./button";

export const PWAStatusIndicator: React.FC = () => {
    const { isOnline, hasUpdate } = usePWA();
    const [showUpdatePrompt, setShowUpdatePrompt] = React.useState(hasUpdate);

    React.useEffect(() => {
        setShowUpdatePrompt(hasUpdate);
    }, [hasUpdate]);

    const handleUpdate = () => {
        window.location.reload();
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
            {/* Offline Indicator */}
            {!isOnline && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-bottom-2">
                    <WifiOff size={16} />
                    <span className="text-sm font-medium">Offline - Mode dengan cache</span>
                </div>
            )}

            {/* Update Available */}
            {showUpdatePrompt && isOnline && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-bottom-2">
                    <RefreshCw size={16} className="animate-spin" />
                    <span className="text-sm font-medium">Update tersedia</span>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2 h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                        onClick={handleUpdate}
                    >
                        Reload
                    </Button>
                    <button
                        onClick={() => setShowUpdatePrompt(false)}
                        className="ml-1 text-blue-600 hover:text-blue-700 font-bold"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
};
