import { useCallback, useEffect, useState } from "react";

interface NotificationOptions {
    body?: string;
    icon?: string;
}

export function useNotification() {
    const [permission, setPermission] = useState<NotificationPermission>(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            return Notification.permission;
        }
        return "default";
    });

    const requestPermission = useCallback(async () => {
        if (typeof window === "undefined" || !("Notification" in window)) return;

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result;
        } catch (error) {
            console.error("Notification permission request failed", error);
        }
    }, []);

    const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
        if (typeof window === "undefined" || !("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification(title, options);
        } else if (Notification.permission !== "denied") {
            // 許可がなぁE��合�Eリクエストしてから送信を試みめE
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    new Notification(title, options);
                }
            });
        }
    }, []);

    return { permission, requestPermission, sendNotification };
}
