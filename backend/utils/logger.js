import { getDate } from './date.js';
import { appendFile } from 'fs';

/**
 * Log messages to the log file.
 * @param {string} data The data to log to the file.
 * @param {string} rawType The type of message. For example: warning, alert, info, fatal, none.
 * @returns Status.
 */
export function logMessage(data, rawType) {
    try {
        let logData;
        let type = rawType;
        if (!rawType) type = "none";
        if (type === "none") {
            logData = `${data}\n`;
        } else logData = `${getDate().time} [${type.toUpperCase()}] ${data}\n`;
        write(logData);
        console.log(logData);
        if (type === "fatal") throw new Error("Fatal log type. Terminated process.");
        return true;
    } catch (error) {
        logError(error);
        return false;
    }
}

/**
 * Log error messages to the log file.
 * @param {Error | string} data The error to write to the file.
 */
export function logError(data) {
    const logData = `${getDate().time} [ERROR] ${typeof data === "string" ? data : data.stack}\n`;
    write(logData);
    console.error(logData);
}

/**
 * The writing to the log file itself.
 * @param {string} data The text to write to the file.
 */
export function write(data) {
    const fullDate = getDate();
    appendFile(`./logs/${fullDate.date}.log`, data, (error) => {
        if (error) {
            console.error(`${fullDate.time} [ERROR] Error appending to log file.`);
            return false;
        }
    });
}

/**
 * Logger for Express requests.
 * @param req The request.
 * @param res The responds.
 * @param next Send downstream.
 */
export function apiMiddleware(req, res, next) {
    if (!req.headers["authorization"] || req.headers["authorization"] !== `Bearer ${process.env.SERVER_KEY}`) return res.sendStatus(401);
    logMessage(`API Request || Agent: ${req.headers["user-agent"]} || HTTP ${req.httpVersion} ${req.method} ${req.url}`, "info");
    next();
}
