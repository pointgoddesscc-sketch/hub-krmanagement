const RATE = new Map();

function clean(value, max) {
  return String(value || "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, max);
}

function refId() {
  return "KRM-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const now = Date.now();
  if (now - (RATE.get(ip) || 0) < 8000) {
    return res.status(429).json({ ok: false, error: "Please wait a moment before sending another request." });
  }
  RATE.set(ip, now);

  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body || "{}"); } catch (e) { body = {}; }
  }
  if (body.website) return res.status(200).json({ ok: true, reference: refId() });

  const name = clean(body.name || body.firstName, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 40);
  const country = clean(body.country, 80);
  const inquiryType = clean(body.inquiryType || body.form, 80);
  const message = clean(body.message, 4000);
  const form = clean(body.form, 40) || "contact";

  if (!name) return res.status(400).json({ ok: false, error: "Please enter your name." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
  if (form !== "newsletter" && message.length < 4) return res.status(400).json({ ok: false, error: "Please enter a message." });

  const reference = refId();
  const inbox = process.env.CONVERSATIONS_INBOX;
  const copy = process.env.COPY_EMAIL || "krmanagementteamsent@gmail.com";
  if (!inbox) return res.status(500).json({ ok: false, error: "Inquiry service is temporarily unavailable." });

  const params = new URLSearchParams();
  params.set("_subject", "KR Management inquiry — " + inquiryType + " [" + reference + "]");
  params.set("_template", "box");
  params.set("_captcha", "false");
  params.set("_cc", copy);
  params.set("source", "KR Management Hub");
  params.set("reference", reference);
  params.set("form", form);
  params.set("name", name);
  params.set("email", email);
  params.set("phone", phone);
  params.set("country", country);
  params.set("inquiryType", inquiryType);
  params.set("message", message);

  try {
    const sent = await fetch("https://formsubmit.co/" + encodeURIComponent(inbox), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: params.toString(),
      redirect: "follow"
    });
    if (!sent.ok && sent.status >= 500) {
      return res.status(502).json({ ok: false, error: "Your request could not be sent. Please try again." });
    }
  } catch (err) {
    return res.status(502).json({ ok: false, error: "Your request could not be sent. Please try again." });
  }

  return res.status(200).json({ ok: true, reference });
}
