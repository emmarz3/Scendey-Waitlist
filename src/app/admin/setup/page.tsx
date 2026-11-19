"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/chrome";

export default function AdminSetup() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/setup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ setupToken: fields.get("setupToken"), email: fields.get("email"), password: fields.get("password") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Setup failed.");
      router.push("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Setup failed.");
      setBusy(false);
    }
  }
  return <main className="page-content container" style={{ maxWidth: 620 }}><Wordmark/><h1 className="section-title" style={{ marginTop: 35 }}>Set up SCENDEY admin</h1><p>Create the first administrator with the setup code stored in the Railway backend service variables. This page works only before the first admin account is created.</p><form className="form-wrap" onSubmit={submit}><div className="field"><label htmlFor="setupToken">Setup code</label><input id="setupToken" name="setupToken" type="password" autoComplete="off" required/></div><div className="field"><label htmlFor="email">Admin email</label><input id="email" name="email" type="email" autoComplete="email" required/></div><div className="field"><label htmlFor="password">Password (at least 14 characters)</label><input id="password" name="password" type="password" minLength={14} maxLength={256} autoComplete="new-password" required/></div>{error && <p className="form-alert" role="alert">{error}</p>}<button className="button button-red" disabled={busy}>{busy ? "Creating admin…" : "Create admin"}</button></form><p><Link href="/admin/sign-in">Already have an account? Sign in</Link></p></main>;
}
