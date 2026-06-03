import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

function Layout() {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith("/admin-dashboard") ||
    location.pathname.startsWith("/user-dashboard") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/my-orders") ||
    location.pathname.startsWith("/my-reservations") ||
    location.pathname.startsWith("/order-details") ||
    location.pathname.startsWith("/reservation/");

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