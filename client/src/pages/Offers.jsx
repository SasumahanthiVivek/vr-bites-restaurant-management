import { getImage } from "../assets/imageMap";

const offerSections = [
  {
    title: "Weekend Specials",
    description:
      "Enjoy curated chef menus every Friday through Sunday, including rotating appetizers, mains, and handcrafted desserts at special bundled pricing.",
  },
  {
    title: "Festival Offers",
    description:
      "During festive seasons, VR BITES introduces limited-time menus with celebratory flavors, complimentary drinks for selected bookings, and group dining rewards.",
  },
  {
    title: "Family Dining Deals",
    description:
      "Our family combos are designed for sharing, with multi-course options that include starters, mains, and beverages to make gatherings easier and more affordable.",
  },
];

function Offers() {
  return (
    <main className="page-shell">
      <section className="about-page-section owner-intro-section">
        <div className="container">
          <div className="text-center mb-5">
            <h1 className="section-title mb-2">Special Offers</h1>
            <p className="section-sub mx-auto">
              Discover seasonal discounts, celebration packages, and chef-led promotions crafted to make every visit
              to VR BITES more rewarding.
            </p>
          </div>

          <div className="row g-4 align-items-stretch">
            <div className="col-lg-6">
              <div className="about-hero-image-wrap h-100">
                <img src={getImage("menu-platter.jpg")} alt="Special offer platter at VR BITES" className="about-hero-image" />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="d-grid gap-3">
                {offerSections.map((offer) => (
                  <article key={offer.title} className="about-value-card">
                    <h2 className="h4 mb-2">{offer.title}</h2>
                    <p className="mb-0">{offer.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Offers;
