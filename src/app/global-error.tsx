"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the real error so it shows in the console / error reporting
    console.error("[global-error] root render failed:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F9FAFB",
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 440, textAlign: "center" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "9999px",
                border: "2px solid #DF2E16",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "#DF2E16",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              !
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 500, color: "#151515", margin: "0 0 8px" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.5, margin: "0 0 16px" }}>
              This page hit an error while loading. Try again — if it keeps happening, your
              cached data may need a refresh.
            </p>
            {(error?.message || error?.digest) && (
              <pre
                style={{
                  textAlign: "left",
                  fontSize: 11,
                  color: "#62646A",
                  background: "#F5F5F7",
                  borderRadius: 8,
                  padding: 12,
                  overflowX: "auto",
                  marginBottom: 16,
                }}
              >
                {error.message || `digest: ${error.digest}`}
              </pre>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: "10px 20px",
                  background: "#151515",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              <button
                onClick={() => {
                  // Clear potentially-corrupt cached card data, then reload
                  try {
                    localStorage.removeItem("recipeDirections");
                    localStorage.removeItem("hiddenDirectionIds");
                  } catch {}
                  window.location.reload();
                }}
                style={{
                  padding: "10px 20px",
                  background: "#fff",
                  color: "#151515",
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 12,
                  border: "1px solid #ECEDEE",
                  cursor: "pointer",
                }}
              >
                Reset & reload
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
