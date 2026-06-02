import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

function Layout() {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith("/admin-dashboard") || location.pathname.startsWith("/user-dashboard");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <>
      <Navbar />
      <Outlet />
      {!isDashboardRoute ? <Footer /> : null}
    </>
  );
}

export default Layout;
