declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let recaptchaScriptPromise: Promise<void> | null = null;

function loadRecaptchaScript(siteKey: string) {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.grecaptcha) {
    return Promise.resolve();
  }

  if (!recaptchaScriptPromise) {
    recaptchaScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-recaptcha-script="true"]',
      );

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load reCAPTCHA")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.defer = true;
      script.dataset.recaptchaScript = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
      document.head.appendChild(script);
    });
  }

  return recaptchaScriptPromise;
}

export async function getRecaptchaToken(
  siteKey: string | undefined,
  action: string,
) {
  const key = siteKey?.trim();
  if (!key || typeof window === "undefined") {
    return undefined;
  }

  await loadRecaptchaScript(key);

  if (!window.grecaptcha) {
    throw new Error("reCAPTCHA is not available");
  }

  return new Promise<string>((resolve, reject) => {
    window.grecaptcha?.ready(() => {
      window.grecaptcha
        ?.execute(key, { action })
        .then(resolve)
        .catch(() => reject(new Error("Failed to verify reCAPTCHA")));
    });
  });
}
