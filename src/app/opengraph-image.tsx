import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SpotlightWars — Pay to Interrupt Everyone Here";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#08070a",
          color: "#f5f1e8",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 900,
            height: 900,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,185,66,0.35) 0%, rgba(245,185,66,0) 70%)",
          }}
        />
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>
          Spotlight<span style={{ color: "#f5b942" }}>Wars</span>
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#928c82" }}>
          Pay to interrupt everyone currently here.
        </div>
      </div>
    ),
    { ...size }
  );
}
