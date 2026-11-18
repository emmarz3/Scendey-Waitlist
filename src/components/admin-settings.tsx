"use client";
import { useEffect, useState } from "react";

type Settings = { campaign_enabled: boolean; referrals_enabled: boolean; campaign_perks: string };
export function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({ campaign_enabled: true, referrals_enabled: true, campaign_perks: "" });
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/admin/settings").then(response => response.json()).then(data => { if (data.campaign_enabled !== undefined) setSettings(data); }).catch(() => setMessage("Could not load settings.")); }, []);
  async function save(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(""); try { const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) }); const data = await response.json(); if (!response.ok) throw Error(data.error); setMessage("Settings saved."); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save settings."); } finally { setBusy(false); } }
  return <form className="form-wrap" onSubmit={save}><label className="check-row"><input type="checkbox" checked={settings.campaign_enabled} onChange={event => setSettings({ ...settings, campaign_enabled: event.target.checked })}/>Enable campaign signup</label><label className="check-row"><input type="checkbox" checked={settings.referrals_enabled} onChange={event => setSettings({ ...settings, referrals_enabled: event.target.checked })}/>Enable referral attribution</label><div className="field"><label htmlFor="campaign-perks">Configured early access benefits</label><textarea id="campaign-perks" maxLength={1000} value={settings.campaign_perks} onChange={event => setSettings({ ...settings, campaign_perks: event.target.value })}/><p className="form-meta">Only list benefits the campaign owner has confirmed.</p></div><button className="button button-dark" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button><p role="status" aria-live="polite">{message}</p></form>;
}
