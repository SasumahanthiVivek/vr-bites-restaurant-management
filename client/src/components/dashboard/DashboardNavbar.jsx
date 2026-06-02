import { useMemo, useState } from "react";
import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";

function DashboardNavbar({
  title,
  user,
  onToggleSidebar,
  showAccountMenu = false,
  showUserChip = true,
  onLogout,
}) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const initials = useMemo(() => {
    const fullName = user?.fullName || user?.username || "User";
    return fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  return (
    <header className="db-topbar">
      <div className="db-topbar-left">
        <button type="button" className="db-icon-btn db-sidebar-toggle" onClick={onToggleSidebar}>
          <Menu size={24} strokeWidth={3.8} />
        </button>
        <h1 className="db-page-title">{title}</h1>
      </div>

      <div className="db-topbar-right">
        <button type="button" className="db-icon-btn db-notification-btn" aria-label="Notifications">
          <Bell size={16} />
          <span className="db-dot" />
        </button>

        {showUserChip ? (
          <div className="db-user-menu">
            {showAccountMenu ? (
            <>
              <button
                type="button"
                className="db-user-trigger"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={isDropdownOpen}
              >
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="User avatar" className="db-avatar-img" />
                ) : (
                  <span className="db-avatar-fallback">{initials}</span>
                )}
                <span className="db-user-name">{user?.firstName || "Guest"}</span>
                <ChevronDown className="db-chevron" size={14} />
              </button>

              {isDropdownOpen ? (
                <div className="db-user-dropdown">
                  <button
                    type="button"
                    className="db-dropdown-item danger"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout?.();
                    }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </>
            ) : (
              <div className="db-user-trigger" aria-label="Signed in user">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="User avatar" className="db-avatar-img" />
                ) : (
                  <span className="db-avatar-fallback">{initials}</span>
                )}
                <span className="db-user-name">{user?.firstName || "Guest"}</span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default DashboardNavbar;
