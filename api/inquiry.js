const RATE = new Map();

function clean(value, max) {
  return String(value || "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, max);
}

function refId() {
  return "KRM-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://hub-krmanagement.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const ip = req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  const last = RATE.get(ip) || 0;
  if (now - last < 8000) return res.status(429).json({ ok: false, error: "Please wait a moment before sending another request." });
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

  try {
    const sent = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(inbox), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: "KR Management inquiry — " + inquiryType + " [" + reference + "]",
        _template: "box",
        _captcha: "false",
        _cc: copy,
        source: "KR Management Hub",
        reference,
        form,
        name,
        email,
        phone,
        country,
        inquiryType,
        preferredDate: clean(body.preferredDate, 40),
        guests: clean(body.guests, 10),
        message,
        submittedAt: new Date().toISOString()
      })
    });
    if (!sent.ok) return res.status(502).json({ ok: false, error: "Your request could not be sent. Please try again." });
  } catch (err) {
    return res.status(502).json({ ok: false, error: "Your request could not be sent. Please try again." });
  }

  return res.status(200).json({ ok: true, reference });
}
