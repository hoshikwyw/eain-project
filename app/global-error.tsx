"use client";

/**
 * Last-resort boundary when the root layout itself fails. No providers are
 * available here, so it is plain HTML in both languages.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#fff8f4", color: "#2b1f21", margin: 0 }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>Something went wrong</h1>
            <p lang="my" style={{ marginBottom: 20, color: "#7a6568" }}>
              တစ်ခုခု မှားသွားပါတယ်။ ထပ်ကြိုးစားပါ။
            </p>
            <button
              onClick={reset}
              style={{ background: "#db3358", color: "#fff", border: 0, borderRadius: 12, padding: "12px 20px", fontWeight: 600 }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
