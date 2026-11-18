"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/chrome";

type Status = { role: string; status: string; invitationSent: boolean; confirmedReferrals: number; emailOptIn: boolean; preferenceToken: string; referralUrl: string | null };

export function MyStatusClient() {
  const params = useSearchParams();
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = params.get("token");
    if (!token) return;
    setBusy(true);
    fetch("/api/status", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async response => { const data = await response.json(); if (!response.ok) throw Error(data.error); setStatus(data); setMessage(""); })
      .catch(error => setMessage(error instanceof Error ? error.message : "Could not load your status."))
      .finally(() => setBusy(false));
  }, [params]);

  async function requestStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const email = new FormData(event.currentTarget).get("email");
      const response = await fetch("/api/status/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json();
      setMessage(data.message);
    } catch { setMessage("Could not request a status link. Try again."); }
    finally { setBusy(false); }
  }

  async function updatePreference(consent: boolean) {
    if (!status) return;
    setBusy(true);
    try {
      const response = await fetch("/api/status/preferences", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: status.preferenceToken, consent }) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      setStatus({ ...status, emailOptIn: data.consent });
      setMessage(data.consent ? "You’ll receive marketing updates." : "You’ve opted out of marketing updates.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update your preference."); }
    finally { setBusy(false); }
  }

  async function copyReferral() { if (!status?.referralUrl) return; try { await navigator.clipboard.writeText(status.referralUrl); await fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "referral_link_copied", role: status.role }) }); setMessage("Referral link copied."); } catch { setMessage("Could not copy the link. Select and copy it below."); } }

  return <SiteShell><main id="main" className="page-content container"><div className="prose"><span className="eyebrow">Your signup</span><h1 className="section-title">Waitlist status</h1>
    {status ? <><div className="status-box"><p>Signup type: <strong>{status.role.toLowerCase()}</strong></p><p>Email verification: <strong>{status.status.toLowerCase()}</strong></p><p>Invitation sent: <strong>{status.invitationSent ? "Yes" : "Not yet"}</strong></p><p>Confirmed referrals: <strong>{status.confirmedReferrals}</strong></p><p>Marketing updates: <strong>{status.emailOptIn ? "Opted in" : "Not opted in"}</strong></p>{status.referralUrl&&<p>Your referral link: <strong><a href={status.referralUrl}>{status.referralUrl}</a></strong> <button type="button" className="button button-quiet button-small" onClick={copyReferral}>Copy link</button></p>}</div><div className="actions"><button className="button button-dark" disabled={busy || status.emailOptIn} onClick={() => updatePreference(true)}>Opt in to updates</button><button className="button button-light" disabled={busy || !status.emailOptIn} onClick={() => updatePreference(false)}>Opt out</button></div><p role="status" aria-live="polite">{message}</p></>
      : <><p>Enter your signup email and we’ll send a private link if we find a matching waitlist entry.</p><form className="form-wrap" onSubmit={requestStatus}><div className="field"><label htmlFor="status-email">Email address</label><input id="status-email" name="email" type="email" autoComplete="email" required maxLength={254}/></div><button className="button button-dark" disabled={busy}>Email me a status link</button><p role="status" aria-live="polite">{busy ? "Working…" : message}</p></form></>}
  </div></main></SiteShell>;
}
