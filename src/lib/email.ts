export type Mail = { to: string; subject: string; html: string };
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const paragraphs = (value: string) => value.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => `<p>${escapeHtml(line)}</p>`).join("");

export const templates = {
  verification: (link: string) => ({ subject: "Confirm your SCENDEY waitlist signup", html: `<p>Thanks for joining SCENDEY.</p><p><a href="${link}">Confirm your email</a> to complete your signup. This link expires in 24 hours.</p>` }),
  welcome: (role: string, link: string) => ({ subject: "You’re on the SCENDEY waitlist", html: `<p>Your email is confirmed. We’ll share meaningful SCENDEY updates with you${role === "BRAND" ? " as we prepare tools for brands" : " as we prepare a new way to discover brands"}.</p><p><a href="${link}">Manage your email preferences</a></p>` }),
  invitation: (link: string) => ({ subject: "Your SCENDEY invitation", html: `<p>Your SCENDEY invitation is ready.</p><p><a href="${link}">View your invitation</a></p>` }),
  progress: (content: string, link: string) => ({ subject: "A SCENDEY progress update", html: `${paragraphs(content)}<p><a href="${escapeHtml(link)}">Manage preferences</a></p>` }),
  unsubscribe: () => ({ subject: "You’re unsubscribed from SCENDEY updates", html: "<p>Your email preferences have been updated. You will not receive campaign updates.</p>" })
};

export async function sendMail(mail: Mail) {
  const endpoint = process.env.EMAIL_API_URL;
  const apiKey = process.env.EMAIL_API_KEY;
  if (!endpoint || !apiKey || !process.env.EMAIL_FROM) {
    if (process.env.NODE_ENV !== "production") console.info(`[SCENDEY mail preview] ${mail.subject} to ${mail.to}\n${mail.html}`);
    return { sent: false, reason: "Email delivery is not configured." };
  }
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ from: process.env.EMAIL_FROM, ...mail }), signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { sent: false, reason: "Email provider rejected the message." };
    return { sent: true };
  } catch { return { sent: false, reason: "Email provider could not be reached." }; }
}
