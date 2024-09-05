const urlBase64ToUint8Array = base64String => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

async function saveSubscription(vapid_public_key, username, backend_url, backend_key) {
    // Subscription Base Payload
    const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid_public_key)
    });

    // Subscription Username Payload
    const subscriptionData = {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime,
        keys: subscription.toJSON().keys,
        username: username
    };

    // Save Subscription
    const response = await fetch(backend_url, {
        method: "POST",
        headers: {
            "Content-type": "application/json",
            "authorization": `Bearer ${backend_key}`
        },
        body: JSON.stringify(subscriptionData)
    });
    return response.json();
}

self.addEventListener("message", async (event) => {
    // Transfer Variables
    if (event.data && event.data.type === "SET_VARIABLES") await saveSubscription(event.data.vapid_public_key, event.data.username, event.data.backend_url, event.data.backend_key);
});

self.addEventListener("activate", async (event) => {
    // Await Message Event
    event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
    // Incoming Push Event
    const payload = event.data.json();
    const message = self.registration.showNotification(payload.title, {
        body: payload.message,
        icon: payload.icon,
    });
    event.waitUntil(message);
});