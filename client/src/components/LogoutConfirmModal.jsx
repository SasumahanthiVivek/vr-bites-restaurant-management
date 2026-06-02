import { AlertTriangle, LogOut, X } from "lucide-react";
import { createPortal } from "react-dom";

function LogoutConfirmModal({ isOpen, onCancel, onConfirm }) {
  if (!isOpen) {
    return null;
  }

  const modal = (
    <div className="logout-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
      <div className="logout-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="logout-modal-icon" aria-hidden="true">
          <AlertTriangle size={24} />
        </div>
        <h3 id="logout-confirm-title" className="logout-modal-title">Confirm Logout</h3>
        <p className="logout-modal-copy">Are you sure you want to logout?</p>

        <div className="logout-modal-actions">
          <button type="button" className="logout-modal-btn cancel" onClick={onCancel}>
            <X size={16} />
            Cancel
          </button>
          <button type="button" className="logout-modal-btn confirm" onClick={onConfirm}>
            <LogOut size={16} />
            Confirm Logout
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default LogoutConfirmModal;
