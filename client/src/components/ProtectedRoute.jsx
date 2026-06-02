import { Navigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { isAdminEmail } from "../auth/authLogic";

function AccessDeniedMessage() {
  return (
    <main className="page-shell dashboard-shell">
      <section className="container py-5 d-flex justify-content-center">
        <article className="db-card" style={{ maxWidth: "560px", width: "100%" }}>
          <h1 style={{ marginTop: 0, marginBottom: "8px" }}>Access Denied</h1>
          <p style={{ margin: 0, color: "#6d6257" }}>Access Denied — Admin privileges required.</p>
        </article>
      </section>
    </main>
  );
}

function ProtectedRoute({ children, requireAdmin = false, requireUser = false }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  const primaryEmail = user?.primaryEmailAddress?.emailAddress || "";
  const isAdmin = isAdminEmail(primaryEmail);

  if (requireAdmin && !isAdmin) {
    return <AccessDeniedMessage />;
  }

  if (requireUser && isAdmin) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
