type VerifyResponse = {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  ["error-codes"]?: string[];
};

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const MIN_SCORE = Number(Deno.env.get("RECAPTCHA_MIN_SCORE") || "0.5");
const SECRET = Deno.env.get("RECAPTCHA_SECRET_KEY") || "";
const EXPECTED_HOSTNAME = Deno.env.get("RECAPTCHA_EXPECTED_HOSTNAME") || "";

function buildError(message: string, status = 400, details: Record<string, unknown> = {}) {
  return Response.json({ error: message, ...details }, { status });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return buildError("Method not allowed.", 405);
    }

    if (!SECRET) {
      return buildError("reCAPTCHA secret is not configured.", 500);
    }

    const payload = await req.json();
    const token = String(payload?.token || "").trim();
    const action = String(payload?.action || "").trim();

    if (!token || !action) {
      return buildError("Missing token or action.");
    }

    const remoteIp = String(
      req.headers.get("cf-connecting-ip")
      || req.headers.get("x-forwarded-for")
      || ""
    ).split(",")[0].trim();

    const body = new URLSearchParams({
      secret: SECRET,
      response: token,
    });

    if (remoteIp) {
      body.set("remoteip", remoteIp);
    }

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const result = await response.json() as VerifyResponse;
    const score = Number(result?.score || 0);
    const actionMatches = !result?.action || result.action === action;
    const hostnameMatches = !EXPECTED_HOSTNAME || !result?.hostname || result.hostname === EXPECTED_HOSTNAME;
    const success = Boolean(result?.success) && actionMatches && hostnameMatches && score >= MIN_SCORE;

    if (!success) {
      return buildError("reCAPTCHA verification failed.", 400, {
        score,
        action: result?.action || "",
        hostname: result?.hostname || "",
        errors: result?.["error-codes"] || [],
        threshold: MIN_SCORE,
      });
    }

    return Response.json({
      success: true,
      score,
      action: result?.action || action,
      hostname: result?.hostname || "",
      threshold: MIN_SCORE,
    });
  } catch (error) {
    return buildError(String(error?.message || error || "reCAPTCHA verification failed."), 500);
  }
});
