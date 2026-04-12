"use client";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#fafafa" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <h2 style={{ color: "#1A1A2E", fontSize: 20, marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: "#717171", fontSize: 14, marginBottom: 24 }}>We&apos;ve been notified and are working on it.</p>
          <button
            onClick={reset}
            style={{ background: "#2D6A4F", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
