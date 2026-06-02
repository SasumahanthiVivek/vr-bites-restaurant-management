import { useEffect } from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
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
import { apiRequest } from "./apiClient";

function SyncSignedInUser() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

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

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const redirectTo = searchParams.get("redirect") || "/";

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
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute requireUser>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
