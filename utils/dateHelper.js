/**
 * Returns current date-time in the given timezone as 'YYYY-MM-DD HH:mm:ss'
 * so MySQL stores the exact local (PC) time when the user performs an action.
 * Default: Asia/Kolkata (IST). Set APP_TIMEZONE in .env if different (e.g. America/New_York).
 */
function getLocalDateTimeString(timeZone = process.env.APP_TIMEZONE || 'Asia/Kolkata') {
  const d = new Date();
  return d.toLocaleString('sv-SE', { timeZone });
}

module.exports = { getLocalDateTimeString };
