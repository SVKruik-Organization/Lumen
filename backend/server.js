import "dotenv/config";
import express, { json } from "express";
import mariadb from 'mariadb';
import webpush from 'web-push';
import cors from 'cors';
import { apiMiddleware, logError, logMessage } from "./utils/logger.js";
const app = express();
app.use(json());
webpush.setVapidDetails(process.env.VAPID_EMAIL, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

// CORS
const corsOptions = {
    origin: [process.env.SERVER_CORS],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(apiMiddleware);

// Database
const database = mariadb.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
});

// Create subscription
app.post("/subscribe", async (req, res) => {
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
            await database.query("INSERT INTO lumen_user (endpoint, expirationTime, p256dh, auth, username) VALUES (?, ?, ?, ?, ?);",
                [newSubscription.endpoint, newSubscription.expirationTime || null, newSubscription.p256dh, newSubscription.auth, newSubscription.username]);
        } catch (error) {
            // Update Existing Subscription
            if (error.code === "ER_DUP_ENTRY") {
                await database.query("UPDATE lumen_user SET endpoint = ?, expirationTime = ?, p256dh = ?, auth = ? WHERE username = ?;",
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
    try {
        // Setup
        const body = req.body;
        if (body.title === undefined || body.message === undefined) return res.sendStatus(400);
        if (!req.params.username) return res.sendStatus(400);
        let data = await database.query("SELECT * FROM lumen_user WHERE username = ?;", [req.params.username]);
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
            icon: "https://files.stefankruik.com/Products/100/Lumen.png"
        }));
        return res.json({ data: "Sent" });
    } catch (error) {
        if (error.statusCode === 410) {
            await database.query("DELETE FROM lumen_user WHERE username = ?;", [req.params.username]);
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
app.listen(port, () => {
    logMessage(`API server listening on port ${port}.`, "info");
});