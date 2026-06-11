"use client";

/**
 * Lightweight notification alert system for the admin dashboard.
 *
 * Three layers, all configurable:
 *  - Synthesised audio ding (Web Audio API — no asset file)
 *  - Browser/OS notification (Notification API)
 *  - In-page toast (caller uses react-hot-toast)
 *
 * Persists mute + permission state to localStorage so admins don't have to
 * reconfigure on every reload.
 */

const STORAGE_MUTE_KEY = "sureride_admin_notif_muted";

// ── Mute state ──────────────────────────────────────────────────────────────

export function isAlertsMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_MUTE_KEY) === "true";
}

export function setAlertsMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_MUTE_KEY, muted ? "true" : "false");
}

// ── Audio ───────────────────────────────────────────────────────────────────
// Two-tone "ding" using oscillators. Soft, short, professional — not a
// jarring system beep.

type W = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

let cachedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (cachedContext) return cachedContext;
  const Ctor =
    (window as W).AudioContext ?? (window as W).webkitAudioContext;
  if (!Ctor) return null;
  try {
    cachedContext = new Ctor();
    return cachedContext;
  } catch {
    return null;
  }
}

export function playNotificationDing(): void {
  if (isAlertsMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Some browsers suspend the context until a user gesture. Resume best-effort.
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  // Two short notes — C5 (523 Hz) then E5 (659 Hz). Sine wave + steep decay.
  const playNote = (frequency: number, startOffset: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = frequency;

    const now = ctx.currentTime + startOffset;
    const duration = 0.18;

    // Quick attack then exponential decay — keeps it sharp without clipping
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  };

  playNote(523.25, 0);
  playNote(659.25, 0.09);
}

// ── Browser/OS notifications ────────────────────────────────────────────────

export type BrowserPermissionState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export function getBrowserPermission(): BrowserPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as BrowserPermissionState;
}

export async function requestBrowserPermission(): Promise<BrowserPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission as BrowserPermissionState;
  }
  try {
    const result = await Notification.requestPermission();
    return result as BrowserPermissionState;
  } catch {
    return "denied";
  }
}

export function showBrowserNotification(opts: {
  title: string;
  body?: string;
  href?: string;
}): void {
  if (isAlertsMuted()) return;
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      tag: "sureride-admin",         // collapses bursts into a single OS toast
      silent: false,
    });
    if (opts.href) {
      n.onclick = () => {
        window.focus();
        window.location.assign(opts.href!);
        n.close();
      };
    }
  } catch {
    // ignore — Notification ctor can throw in some embeds
  }
}

// ── Helper: full alert (audio + browser/toast picker) ──────────────────────

export function alertNewNotification(opts: {
  title: string;
  body?: string;
  href?: string;
  onVisible?: () => void; // called when tab IS visible — caller shows in-page toast
}): void {
  if (isAlertsMuted()) return;

  playNotificationDing();

  if (typeof document !== "undefined" && document.hidden) {
    // Tab is in background → use OS toast
    showBrowserNotification({
      title: opts.title,
      body: opts.body,
      href: opts.href,
    });
  } else {
    // Tab is foregrounded → caller handles the in-page toast
    opts.onVisible?.();
  }
}
