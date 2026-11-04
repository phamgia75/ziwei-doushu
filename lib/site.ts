/** Base URL of the local app. Override with NEXT_PUBLIC_SITE_URL (see .env.example). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

/** Host part only, for display. */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');
