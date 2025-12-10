import "dotenv/config";
import express, { json } from "express";
import webpush from "web-push";
import cors from "cors";
import { logData, logError } from "@svkruik/sk-platform-formatters";
import { database } from "@svkruik/sk-platform-db-conn";
const app = express();
app.use(json());
webpush.setVapidDetails(process.env.VAPID_EMAIL, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

// CORS
const corsOptions = {
    origin: process.env.SERVER_CORS.split(","),
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
    if (!req.headers["authorization"] || req.headers["authorization"] !== `Bearer ${process.env.SERVER_KEY}`) return res.sendStatus(401);
    logData(`API Request || Agent: ${req.headers["user-agent"]} || HTTP ${req.httpVersion} ${req.method} ${req.url}`, "info");
    next();
});

// Create subscription
app.post("/subscribe", async (req, res) => {
    const connection = await database("central");
    try {
        // Setup
        const payload = req.body;
        const newSubscription = {
            endpoint: payload.endpoint,
            expirationTime: payload.expirationTime,
            p256dh: payload.keys.p256dh,
            auth: payload.keys.auth,
            username: payload.username
        };
        if (newSubscription.endpoint === undefined || newSubscription.p256dh === undefined || newSubscription.auth === undefined) return res.sendStatus(400);

        try {
            // New Subscription
            await connection.query("INSERT INTO lumen_user (endpoint, expiration_time, p256dh, auth, username) VALUES (?, ?, ?, ?, ?);",
                [newSubscription.endpoint, newSubscription.expirationTime || null, newSubscription.p256dh, newSubscription.auth, newSubscription.username]);
        } catch (error) {
            // Update Existing Subscription
            if (error.code === "ER_DUP_ENTRY") {
                await connection.query("UPDATE lumen_user SET endpoint = ?, expiration_time = ?, p256dh = ?, auth = ? WHERE username = ?;",
                    [newSubscription.endpoint, newSubscription.expirationTime || null, newSubscription.p256dh, newSubscription.auth, newSubscription.username]);
            } else throw error;
        }
        res.json({ data: "Received" });
    } catch (error) {
        logError(error);
        res.sendStatus(500);
    }
});

// Send notification
app.post("/send/:username", async (req, res) => {
    const connection = await database("central");
    try {
        // Setup
        const body = req.body;
        if (body.title === undefined || body.message === undefined) return res.sendStatus(400);
        if (!req.params.username) return res.sendStatus(400);
        let data = await connection.query("SELECT * FROM lumen_user WHERE username = ?;", [req.params.username]);
        if (data.length === 0) return res.sendStatus(404);
        data = data[0];

        // Payload Prepare
        const payload = {
            endpoint: data.endpoint,
            expirationTime: data.expirationTime,
            keys: {
                p256dh: data.p256dh,
                auth: data.auth
            }
        }

        // Send Notification
        await webpush.sendNotification(payload, JSON.stringify({
            title: req.body.title,
            message: req.body.message,
            icon: req.body.icon || "https://files.stefankruik.com/Products/100/Lumen.png"
        }));
        return res.json({ data: "Sent" });
    } catch (error) {
        if (error.statusCode === 410) {
            await connection.query("DELETE FROM lumen_user WHERE username = ?;", [req.params.username]);
            return res.json({ data: "Expired. Re-register." });
        } else {
            logError(error);
            return res.sendStatus(500);
        }
    }
});

// Default Routes
app.get("*", async (_req, res) => {
    res.send("SK Lumen API");
});
app.post("*", async (_req, res) => {
    res.send("SK Lumen API");
});

// Init
const port = process.env.SERVER_PORT;
app.listen(port, () => logData(`Lumen API server listening on port ${process.env.SERVER_PORT}`, "info"));