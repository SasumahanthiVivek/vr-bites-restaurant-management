import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { AiOutlineHome } from "react-icons/ai";
import { BiRestaurant } from "react-icons/bi";
import { FiInfo, FiLogIn, FiLogOut } from "react-icons/fi";
import { MdOutlineEventSeat } from "react-icons/md";
import { RiDashboardLine } from "react-icons/ri";
import { navItems } from "../data/siteData";
import logo from "../assets/images/logo.png";
import { isAdminEmail } from "../auth/authLogic";
import LogoutConfirmModal from "./LogoutConfirmModal";

function Navbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const desktopProfileRef = useRef(null);
  const mobileProfileRef = useRef(null);
  const navIconById = {
    home: AiOutlineHome,
    menu: BiRestaurant,
    about: FiInfo,
    "book-table": MdOutlineEventSeat,
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const closeProfile = () => {
    setProfileOpen(false);
  };

  useEffect(() => {
    closeMenu();
    closeProfile();
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const target = event.target;
      if (menuRef.current?.contains(target) || toggleButtonRef.current?.contains(target)) {
        return;
      }

      closeMenu();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isProfileOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        desktopProfileRef.current?.contains(event.target) ||
        mobileProfileRef.current?.contains(event.target)
      ) {
        return;
      }

      closeProfile();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        closeMenu();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const dashboardPath = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress || "";
    return isAdminEmail(email) ? "/admin-dashboard" : "/user-dashboard";
  }, [user]);

  const onLogout = () => {
    closeProfile();
    closeMenu();
    setLogoutModalOpen(true);
  };

  const cancelLogout = () => {
    setLogoutModalOpen(false);
  };

  const confirmLogout = async () => {
    setLogoutModalOpen(false);
    closeProfile();
    closeMenu();
    await signOut({ redirectUrl: "/" });
  };

  return (
    <nav className="navbar navbar-expand-lg fixed-top glass-nav py-2">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <img src={logo} alt="VR BITES logo" className="brand-logo" />
          <span className="brand-font fw-bold brand-title">VR BITES</span>
        </Link>

        <div className="mobile-top-actions">
          {isSignedIn ? (
            <div className="profile-dropdown mobile-profile-dropdown" ref={mobileProfileRef}>
              <button
                type="button"
                className="mobile-profile-trigger"
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-expanded={isProfileOpen}
                aria-label="Open profile actions"
              >
                <img src={user?.imageUrl || ""} alt="Profile avatar" className="mobile-profile-chip-avatar" />
              </button>

              {isProfileOpen ? (
                <div className="profile-menu mobile-profile-menu">
                  <Link to={dashboardPath} className="profile-menu-item" onClick={closeProfile}>
                    <RiDashboardLine />
                    <span>My Dashboard</span>
                  </Link>
                  <button type="button" className="profile-menu-item danger" onClick={onLogout}>
                    <FiLogOut />
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            ref={toggleButtonRef}
            className="navbar-toggler"
            type="button"
            aria-controls="mainNav"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
            onClick={() => setIsMenuOpen(true)}
          >
            <i className="bi bi-list mobile-toggle-icon"></i>
          </button>
        </div>

        <div
          ref={menuRef}
          className={`navbar-collapse custom-navbar-collapse flex-lg-grow-1 ${isMenuOpen ? "is-open" : ""}`}
          id="mainNav"
        >
          <button type="button" className="mobile-menu-close" onClick={closeMenu} aria-label="Close menu">
            <i className="bi bi-x-lg"></i>
          </button>

          <ul className="navbar-nav desktop-nav-links premium-nav-list mb-2 mb-lg-0 align-items-lg-stretch justify-content-lg-center flex-lg-row flex-column">
            {navItems.map((item) => {
              const NavItemIcon = navIconById[item.id];

              return (
                <li className="nav-item d-flex justify-content-center align-items-lg-stretch" key={item.id}>
                  <NavLink
                    className={({ isActive }) =>
                      `nav-link premium-nav-link mobile-nav-link d-flex flex-column align-items-center justify-content-center text-center text-decoration-none ${isActive ? "active" : ""}`
                    }
                    to={item.path}
                    end={item.path === "/"}
                    onClick={closeMenu}
                  >
                    <span className="premium-nav-icon-slot d-inline-flex align-items-center justify-content-center flex-shrink-0" aria-hidden="true">
                      {NavItemIcon ? <NavItemIcon className="premium-nav-icon" aria-hidden="true" /> : null}
                    </span>
                    <span className="premium-nav-label">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>

          <div className="navbar-auth d-flex align-items-center justify-content-lg-end">
            {!isSignedIn ? (
              <Link className="navbar-login-btn" to="/sign-in" onClick={closeMenu}>
                <FiLogIn className="navbar-login-icon" aria-hidden="true" />
                Login
              </Link>
            ) : null}

            {isSignedIn ? (
              <div className="profile-dropdown" ref={desktopProfileRef}>
                <button
                  type="button"
                  className="profile-trigger"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  aria-expanded={isProfileOpen}
                >
                  <img src={user?.imageUrl || ""} alt="Profile avatar" className="profile-avatar" />
                </button>

                {isProfileOpen ? (
                  <div className="profile-menu">
                    <Link to={dashboardPath} className="profile-menu-item" onClick={closeProfile}>
                      <RiDashboardLine />
                      <span>My Dashboard</span>
                    </Link>
                    <button type="button" className="profile-menu-item danger" onClick={onLogout}>
                      <FiLogOut />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className={`mobile-nav-backdrop ${isMenuOpen ? "is-open" : ""}`} onClick={closeMenu} aria-hidden="true"></div>
      <LogoutConfirmModal isOpen={isLogoutModalOpen} onCancel={cancelLogout} onConfirm={confirmLogout} />
    </nav>
  );
}

export default Navbar;
