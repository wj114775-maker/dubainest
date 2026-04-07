import { base44 } from "@/api/base44Client";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LcgbaosAAAAAG4L0d-EM7sO-IEpqTBAJKsLjRt6";

let scriptPromise = null;

function getExistingScript() {
  if (typeof document === "undefined") return null;
  return document.querySelector(`script[data-recaptcha-site-key="${RECAPTCHA_SITE_KEY}"]`);
}

export function getRecaptchaSiteKey() {
  return RECAPTCHA_SITE_KEY;
}

export function preloadRecaptchaScript() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!RECAPTCHA_SITE_KEY) return Promise.reject(new Error("reCAPTCHA site key is not configured."));
  if (window.grecaptcha?.execute) return Promise.resolve(window.grecaptcha);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = getExistingScript();
    if (existing) {
      if (window.grecaptcha?.execute) {
        resolve(window.grecaptcha);
        return;
      }

      const poll = window.setInterval(() => {
        if (window.grecaptcha?.execute) {
          window.clearInterval(poll);
          resolve(window.grecaptcha);
        }
      }, 50);

      existing.addEventListener("load", () => {
        window.clearInterval(poll);
        resolve(window.grecaptcha);
      }, { once: true });
      existing.addEventListener("error", () => {
        window.clearInterval(poll);
        reject(new Error("reCAPTCHA failed to load."));
      }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`;
    script.async = true;
    script.defer = true;
    script.dataset.recaptchaSiteKey = RECAPTCHA_SITE_KEY;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve(window.grecaptcha);
    };
    script.onerror = () => reject(new Error("reCAPTCHA failed to load."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function executeRecaptcha(action) {
  const grecaptcha = await preloadRecaptchaScript();
  if (!grecaptcha?.execute) {
    throw new Error("reCAPTCHA is unavailable.");
  }

  return new Promise((resolve, reject) => {
    grecaptcha.ready(() => {
      grecaptcha.execute(RECAPTCHA_SITE_KEY, { action }).then(resolve).catch(reject);
    });
  });
}

export async function verifyRecaptchaAction(action) {
  const token = await executeRecaptcha(action);
  await base44.functions.invoke("verifyPublicRecaptcha", { token, action });
  return token;
}
