function checkPermission(): void {
    // Required Browser APIs
    if (!("serviceWorker" in navigator)) throw new Error("Browser does not support Service Worker API.");
    if (!("Notification" in window)) throw new Error("Browser does not support Notification API.");
    if (!("PushManager" in window)) throw new Error("Browser does not support Push API.");
}

async function registerSW(vapidPublicKey: string, username: string, subscribeUrl: string, subscribeKey: string): Promise<boolean> {
    try {
        const registration = await navigator.serviceWorker.register("service-worker.js");

        if (registration.active) {
            // Service worker ready, send message to it.
            registration.active.postMessage({
                type: "SET_VARIABLES",
                vapid_public_key: vapidPublicKey,
                username: username,
                backend_url: subscribeUrl,
                backend_key: subscribeKey
            });
            return true;
        } else {
            // Service worker not ready yet, wait for it to be ready.
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!navigator.serviceWorker.controller) return;
                navigator.serviceWorker.controller.postMessage({
                    type: "SET_VARIABLES",
                    vapid_public_key: vapidPublicKey,
                    username: username,
                    backend_url: subscribeUrl,
                    backend_key: subscribeKey
                });
            });
            return true;
        }
    } catch (error) {
        console.error(error);
        return false;
    }
}

async function requestNotificationPermission(): Promise<void> {
    // Request Permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Browser does not grant notification permission.");
}

export async function initNotification(username: string): Promise<boolean> {
    // Variables
    const vapidPublicKey = import.meta.env.VITE_PUBLIC_VAPID_KEY as string;
    const backendUrl = import.meta.env.VITE_API_BASE as string;
    const backendKey = import.meta.env.VITE_API_KEY as string;
    if (!vapidPublicKey || !backendUrl) return false;

    // Init
    checkPermission();
    await requestNotificationPermission();
    return await registerSW(vapidPublicKey, username, (backendUrl + "/subscribe"), backendKey);
}