import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { isAdminEmail } from "../auth/authLogic";

export function AccessDeniedMessage() {
  return (
    <main className="page-shell dashboard-shell">
      <section className="container py-5 d-flex justify-content-center">
        <article className="db-card" style={{ maxWidth: "560px", width: "100%" }}>
          <h1 style={{ marginTop: 0, marginBottom: "8px", textTransform: "uppercase" }}>ACCESS DENIED</h1>
          <p style={{ margin: 0, color: "#6d6257" }}>You do not have permission to access this page.</p>
          <p style={{ margin: "8px 0 0", color: "#6d6257" }}>Please log in using an administrator account.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
            <Link className="btn btn-outline-brand" to="/">Go Home</Link>
            <Link className="btn btn-brand" to="/sign-in">Login</Link>
          </div>
        </article>
      </section>
    </main>
  );
}

function ProtectedRoute({ children, requireAdmin = false, requireUser = false }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const location = useLocation();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?redirect=${redirect}`} replace />;
  }

  const primaryEmail = user?.primaryEmailAddress?.emailAddress || "";
  const isAdmin = isAdminEmail(primaryEmail);

  if (requireAdmin && !isAdmin) {
    return <AccessDeniedMessage />;
  }

  if (requireUser && isAdmin) {
    return <AccessDeniedMessage />;
  }

  return children;
}

export default ProtectedRoute;
