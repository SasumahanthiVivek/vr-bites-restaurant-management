import { getImage } from "../assets/imageMap";

function OurStory() {
  return (
    <main className="page-shell about-page">
      <section className="about-page-section about-hero-section">
        <div className="container">
          <div className="about-hero-grid">
            <div className="about-hero-image-wrap">
              <img src={getImage("aboutsec1.jpg")} alt="VR BITES dining interior" className="about-hero-image" />
            </div>
            <div>
              <h1 className="section-title mb-3">Our Story</h1>
              <p className="about-paragraph">
                VR BITES began as a small idea between food lovers who believed that a great meal should feel both
                comforting and memorable. What started with family recipes and weekend tasting menus has grown into a
                restaurant where guests celebrate milestones, reconnect with friends, and discover new flavors.
              </p>
              <p className="about-paragraph mb-0">
                Every service is built on warm hospitality, consistent quality, and genuine care for each guest. We
                welcome every table with the same attention we would give in our own home.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-page-section about-story-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <article className="about-value-card h-100">
                <h2 className="h4 mb-3">Our Vision</h2>
                <p className="mb-0">
                  To be the most trusted neighborhood restaurant for modern comfort food, known for flavor, integrity,
                  and unforgettable guest experiences.
                </p>
              </article>
            </div>
            <div className="col-lg-4">
              <article className="about-value-card h-100">
                <h2 className="h4 mb-3">Our Mission</h2>
                <p className="mb-0">
                  To serve thoughtfully crafted dishes using fresh ingredients, while creating a welcoming space where
                  every guest feels valued from arrival to farewell.
                </p>
              </article>
            </div>
            <div className="col-lg-4">
              <article className="about-value-card h-100">
                <h2 className="h4 mb-3">Our Culinary Philosophy</h2>
                <p className="mb-0">
                  We balance classic techniques with contemporary taste, focusing on seasonal produce, clean plating,
                  and bold but approachable flavors.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default OurStory;
