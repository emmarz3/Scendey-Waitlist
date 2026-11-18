import type { Metadata } from "next";
import "./globals.css";

const site = process.env.CANONICAL_URL ?? "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(site), title: { default: "SCENDEY — Your brand in motion", template: "%s — SCENDEY" },
  description: "A new home for Nigerian brands to be discovered, sell through their own store link, and keep business moving. Join the SCENDEY waitlist.",
  openGraph: { title: "SCENDEY — Your brand in motion", description: "Join the SCENDEY prelaunch waitlist.", type: "website", images: ["/opengraph-image"] },
  icons: { icon: "/icon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
