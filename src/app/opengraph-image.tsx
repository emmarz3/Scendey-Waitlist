import { ImageResponse } from "next/og";
export const alt = "SCENDEY — Your brand in motion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#171A1D", color: "#F4F5F5", padding: 72 }}><div style={{ display:"flex",fontSize: 34, letterSpacing: 4 }}>SCENDEY<span style={{ color: "#D62832" }}>.</span></div><div style={{ display:"flex",flexDirection:"column",fontSize: 82, lineHeight: 1.06, maxWidth: 900 }}><span>Your brand in motion.</span><span>Your business under control.</span></div><div style={{ display:"flex",fontSize: 24, color: "#C4C9CD" }}>A new way to discover and shop Nigerian brands.</div></div>, size);
}
