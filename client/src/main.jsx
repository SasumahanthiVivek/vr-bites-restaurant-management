import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/app.css";
import "./styles/food.css";
import "./styles/dashboard.css";
import "./styles/responsive.css";
import faviconUrl from "./assets/images/favicon.png";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const root = ReactDOM.createRoot(document.getElementById("root"));

const setFavicon = (url) => {
  try {
    const existing = document.querySelector('link[rel="icon"]');
    if (existing) {
      existing.href = url;
      existing.type = "image/png";
      return;
    }
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = url;
    document.head.appendChild(link);
  } catch (e) {
    // ignore server-side or non-DOM environments
  }
};

setFavicon(faviconUrl);

if (!clerkPublishableKey) {
  root.render(
    <React.StrictMode>
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          fontFamily: "Manrope, sans-serif",
          background: "#f8f5f1",
          color: "#2d251e",
        }}
      >
        <div
          style={{
            maxWidth: "620px",
            background: "#fff",
            border: "1px solid #ecd8c2",
            borderRadius: "16px",
            boxShadow: "0 12px 28px rgba(26, 20, 12, 0.08)",
            padding: "22px",
          }}
        >
          <h1 style={{ marginTop: 0, marginBottom: "8px", fontSize: "1.25rem" }}>Missing Clerk Key</h1>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to <code>client/.env.local</code>, then restart the Vite dev server.
          </p>
        </div>
      </main>
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3600,
              style: {
                borderRadius: "12px",
                border: "1px solid #efd8c4",
                background: "#fff8f1",
                color: "#3c2f24",
              },
            }}
          />
        </BrowserRouter>
      </ClerkProvider>
    </React.StrictMode>
  );
}
