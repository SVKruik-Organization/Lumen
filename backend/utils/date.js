/**
 * Timestamp Calculation
 * @param {Date} datetime Overwrite Date.now.
 * @param {string} preferredLocale Overwrite default locale.
 * @returns Object with date, time, now and the full date string.
 */
export function getDate(datetime, preferredLocale) {
    let targetDate = new Date();
    if (datetime) targetDate = new Date(datetime);
    let locale = "en-US";
    if (preferredLocale) locale = preferredLocale;
    const today = new Date(targetDate.toLocaleString(locale, {
        timeZone: "Europe/Amsterdam"
    }));

    const hh = formatTime(today.getHours());
    const m = formatTime(today.getMinutes());

    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();

    const date = `${dd}-${mm}-${yyyy}`;
    const time = `${hh}:${m}`;
    const fullDate = `${time} ${date}`;

    /**
     * Time formatter.
     * @param {number} value Add an extra zero if the input number is not double-digit.
     * @returns Formatted value.
     */
    function formatTime(value) {
        return value < 10 ? "0" + value : value.toString();
    }

    return { date, time, today, fullDate };
}
