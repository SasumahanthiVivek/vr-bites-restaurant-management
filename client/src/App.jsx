import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import { SignIn, useAuth, useUser } from "@clerk/clerk-react";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import MenuDiscoveryPage from "./pages/MenuDiscoveryPage";
import AboutPage from "./pages/AboutPage";
import BookTable from "./pages/BookTable";
import FeaturedItemPage from "./pages/FeaturedItemPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import CheckoutPage from "./pages/CheckoutPage";
import OurStory from "./pages/OurStory";
import Offers from "./pages/Offers";
import ChefSpecials from "./pages/ChefSpecials";
import Careers from "./pages/Careers";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import { isAdminEmail } from "./auth/authLogic";
import { apiRequest, setApiAuthTokenProvider } from "./apiClient";

function getSafeRedirect(value) {
  const redirect = String(value || "").trim();
  if (!redirect.startsWith("/") || redirect.startsWith("//")) {
    return "";
  }
  return redirect;
}

function SyncSignedInUser() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  setApiAuthTokenProvider(() => getToken());

  useEffect(() => {
    setApiAuthTokenProvider(() => getToken());
    return () => setApiAuthTokenProvider(null);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      return;
    }

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      return;
    }

    const payload = {
      clerkId: user.id,
      email,
      fullName: user.fullName || user.username || "Guest",
      avatar: user.imageUrl || "",
    };

    apiRequest("/api/users/sync", {
      method: "POST",
      body: JSON.stringify(payload),
    }).catch(() => {
      // Sync failures should not block page render.
    });
  }, [isLoaded, isSignedIn, user]);

  return null;
}

function SignInPage() {
  const [searchParams] = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    const email = user?.primaryEmailAddress?.emailAddress || "";
    const redirectTo = getSafeRedirect(searchParams.get("redirect"));
    return <Navigate to={redirectTo || (isAdminEmail(email) ? "/admin-dashboard" : "/user-dashboard")} replace />;
  }

  const redirectTo = getSafeRedirect(searchParams.get("redirect")) || "/";

  return (
    <main className="page-shell dashboard-shell">
      <section className="container py-5 d-flex justify-content-center">
        <SignIn
          forceRedirectUrl={redirectTo}
          fallbackRedirectUrl={redirectTo}
          signUpForceRedirectUrl={redirectTo}
          signUpFallbackRedirectUrl={redirectTo}
        />
      </section>
    </main>
  );
}

function DashboardRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  const email = user?.primaryEmailAddress?.emailAddress || "";
  return <Navigate to={isAdminEmail(email) ? "/admin-dashboard" : "/user-dashboard"} replace />;
}

// Single persistent AdminDashboard wrapper — reads initial tab from URL once on mount.
// All sidebar navigation is pure state; no URL changes, no remounts.
function AdminDashboardRoute() {
  const location = useLocation();
  return (
    <ProtectedRoute requireAdmin>
      <AdminDashboard initialTab={location.pathname} />
    </ProtectedRoute>
  );
}

// Single persistent UserDashboard wrapper — reads initial tab + detail IDs from URL once on mount.
// All sidebar navigation is pure state; no URL changes, no remounts.
function UserDashboardRoute() {
  const location = useLocation();
  // Extract detailOrderId from /order-details/:id
  const orderDetailMatch = location.pathname.match(/^\/order-details\/(.+)$/);
  const detailOrderId = orderDetailMatch ? orderDetailMatch[1] : "";
  // Extract detailReservationId from /reservation/:id
  const reservationDetailMatch = location.pathname.match(/^\/reservation\/(.+)$/);
  const detailReservationId = reservationDetailMatch ? reservationDetailMatch[1] : "";

  return (
    <ProtectedRoute requireUser>
      <UserDashboard
        initialTab={location.pathname}
        detailOrderId={detailOrderId}
        detailReservationId={detailReservationId}
      />
    </ProtectedRoute>
  );
}

function App() {
  return (
    <>
      <SyncSignedInUser />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/menu-discovery" element={<MenuDiscoveryPage />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute requireUser>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/book-table" element={<BookTable />} />
          <Route path="/featured/:slug" element={<FeaturedItemPage />} />
          <Route path="/our-story" element={<OurStory />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/chef-specials" element={<ChefSpecials />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />

          {/* ── Admin Dashboard: single catch-all, one persistent instance ── */}
          <Route path="/admin-dashboard" element={<AdminDashboardRoute />} />
          <Route path="/admin-dashboard/*" element={<AdminDashboardRoute />} />
          <Route path="/admin" element={<AdminDashboardRoute />} />
          <Route path="/admin/*" element={<AdminDashboardRoute />} />

          {/* ── User Dashboard: single catch-all, one persistent instance ── */}
          <Route path="/user-dashboard" element={<UserDashboardRoute />} />
          <Route path="/user-dashboard/*" element={<UserDashboardRoute />} />
          <Route path="/my-orders" element={<UserDashboardRoute />} />
          <Route path="/my-orders/*" element={<UserDashboardRoute />} />
          <Route path="/my-reservations" element={<UserDashboardRoute />} />
          <Route path="/my-reservations/*" element={<UserDashboardRoute />} />
          <Route path="/order-details/:id" element={<UserDashboardRoute />} />
          <Route path="/reservation/:id" element={<UserDashboardRoute />} />
        </Route>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;