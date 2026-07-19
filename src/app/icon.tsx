import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#05070d",
          color: "#00f0ff",
          fontSize: 20,
          fontWeight: 700,
          borderRadius: 6,
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}
