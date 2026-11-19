type FormspreeFields = Record<string, string>;

// Formspree handles owner notifications and, when enabled on the form,
// a static acknowledgement to the submitted email address. It cannot send
// this application's unique email-verification links or campaign messages.
export async function notifyFormspree(fields: FormspreeFields) {
  const formId = process.env.FORMSPREE_FORM_ID?.trim();
  if (!formId) return { sent: false, reason: "Formspree is not configured." };
  if (!/^[a-zA-Z0-9]+$/.test(formId)) return { sent: false, reason: "Invalid Formspree form ID." };
  try {
    const response = await fetch(`https://formspree.io/f/${formId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(fields),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return { sent: false, reason: `Formspree returned HTTP ${response.status}.` };
    return { sent: true };
  } catch {
    return { sent: false, reason: "Formspree could not be reached." };
  }
}
