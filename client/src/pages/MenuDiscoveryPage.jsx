import { Leaf, ShieldCheck, Utensils } from "lucide-react";
import { menuItems } from "../data/siteData";

function MenuDiscoveryPage() {
  const spotlightItems = menuItems.slice(0, 8);

  return (
    <main className="page-shell menu-discovery-page">
      <section className="menu-discovery-hero">
        <div className="container">
          <p className="menu-kicker mb-2">Signature Selection</p>
          <h1 className="menu-discovery-title">Discover the Taste of VR BITES</h1>
          <p className="menu-discovery-copy mb-0">
            This curated menu preview showcases our top-loved dishes. Explore flavors first, then open the full menu
            for complete ordering and checkout.
          </p>

          <div className="menu-discovery-highlights">
            <article>
              <span><Leaf size={16} /> Fresh Ingredients</span>
              <p>Prepared daily with carefully selected produce and premium pantry staples.</p>
            </article>
            <article>
              <span><Utensils size={16} /> Chef-Curated Plates</span>
              <p>Balanced recipes designed for flavor, comfort, and memorable dining.</p>
            </article>
            <article>
              <span><ShieldCheck size={16} /> Secure Ordering</span>
              <p>End-to-end checkout flow with protected payments and live order status updates.</p>
            </article>
          </div>

          <div className="menu-discovery-note" role="note" aria-live="polite">
            <h2>Chef&apos;s Note</h2>
            <p>
              Our menu evolves with seasonality and guest favorites. Visit the <strong>Menu</strong> tab in the main
              navigation to view the full collection and place your order.
            </p>
          </div>
        </div>
      </section>

      <section className="menu-page-section pt-0">
        <div className="container">
          <div className="row g-4">
            {spotlightItems.map((item) => (
              <div className="col-sm-6 col-lg-4 col-xl-3" key={item.id}>
                <article className="menu-card h-100">
                  <img src={item.image} alt={item.name} />
                  <div className="p-3 menu-card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      <h2 className="h6 mb-1 menu-title">{item.name}</h2>
                      <i className={`bi ${item.icon} text-danger`} />
                    </div>
                    <p className="text-secondary small mb-3 menu-desc">
                      {item.description || "Chef-crafted flavor with fresh and premium ingredients."}
                    </p>
                    <span className="menu-price">{item.price}</span>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default MenuDiscoveryPage;
