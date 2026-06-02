import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { ShieldAlert, LayoutDashboard, UtensilsCrossed } from "lucide-react";
import ReservationForm from "../components/ReservationForm";
import { isAdminEmail } from "../auth/authLogic";

function BookTable() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const isAdmin = isAdminEmail(email);

  return (
    <main className="page-shell book-table-page">
      <section className="book-table-hero py-5">
        <div className="container text-center">
          <h1 className="book-table-title mb-3">{isAdmin ? "Admin Access" : "Reserve Your Table"}</h1>
          <p className="mb-0 mx-auto book-table-subtext">
            {isAdmin
              ? "Reservation features are available only for customer accounts."
              : "Enjoy a seamless reservation experience and let us prepare a memorable dining moment for you."}
          </p>
        </div>
      </section>

      <section className="pt-0 pb-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-xl-10">
              {isAdmin ? (
                <article className="admin-booktable-block card border-0 mx-auto">
                  <div className="admin-booktable-icon">
                    <ShieldAlert size={28} />
                  </div>
                  <h2 className="admin-booktable-title">You are logged in as Admin</h2>
                  <p className="admin-booktable-copy">
                    You are managing your own restaurant website, so table reservations are disabled for admin accounts.
                    Use the dashboard to monitor customer reservations and orders.
                  </p>
                  <div className="admin-booktable-actions">
                    <Link to="/admin-dashboard" className="btn btn-brand admin-booktable-btn">
                      <LayoutDashboard size={16} />
                      Go to Admin Dashboard
                    </Link>
                    <Link to="/menu" className="btn btn-outline-brand admin-booktable-btn">
                      <UtensilsCrossed size={16} />
                      Browse Menu
                    </Link>
                  </div>
                </article>
              ) : (
                <ReservationForm />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default BookTable;
