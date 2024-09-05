/**
 * Test fetch the backend.
 */
export async function fetchBase(): Promise<boolean> {
    try {
        const response = await fetch(import.meta.env.VITE_API_BASE, {
            method: "GET"
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Send a notification.
 */
export async function fetchSend(username: string, title: string, message: string): Promise<boolean> {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE}/send/${username}`, {
            method: "POST",
            body: JSON.stringify({ "title": title, "message": message }),
            headers: {
                "authorization": `Bearer ${import.meta.env.VITE_API_KEY}`,
                "Content-Type": "application/json",
            },
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}