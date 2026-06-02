function Sidebar({ menuItems, activeItem, onSelect, isOpen, onClose, role }) {
  const roleClassName = role === "ADMIN" ? "admin-sidebar" : "user-sidebar";

  return (
    <>
      <aside className={`db-sidebar ${roleClassName} ${isOpen ? "open" : ""}`}>
        <div className="db-sidebar-head">
          <span className="db-logo-link">
            <span className="db-logo-mark">VR</span>
            <span className="db-logo-text">VR BITES</span>
          </span>
          <span className="db-role-chip">{role}</span>
        </div>

        <nav className="db-sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`db-menu-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  onSelect(item.key);
                  onClose();
                }}
              >
                <Icon className="db-menu-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <button
        type="button"
        className={`db-sidebar-overlay ${isOpen ? "show" : ""}`}
        aria-label="Close sidebar"
        onClick={onClose}
      />
    </>
  );
}

export default Sidebar;
