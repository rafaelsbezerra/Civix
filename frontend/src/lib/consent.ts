import { getCookie, setCookie } from "./cookies";

export type Consent = { v: 1; analytics: boolean; marketing: boolean };

const COOKIE = "consentimento";
const OPEN_EVENT = "cookies:abrir";

export function readConsent(): Consent | null {
  try {
    const raw = getCookie(COOKIE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.v === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveConsent(c: Omit<Consent, "v">) {
  setCookie(COOKIE, JSON.stringify({ v: 1, ...c }));
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenPreferences(handler: () => void) {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}