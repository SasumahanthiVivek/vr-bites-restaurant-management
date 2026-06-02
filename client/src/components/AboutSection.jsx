import { aboutImage } from "../data/siteData";

function AboutSection() {
  return (
    <section id="about" className="bg-white">
      <div className="container">
        <div className="row g-5 align-items-center">
          <div className="col-lg-6">
            <img src={aboutImage} alt="VR BITES" className="about-image" />
          </div>
          <div className="col-lg-6">
            <h2 className="section-title mb-3">About Us</h2>
            <h5 className="mb-3">Welcome to VR BITES</h5>
            <p className="text-secondary">
              At VR BITES, we believe that food is more than just a meal - it is an
              experience. Located in the heart of the city, we bring you a perfect blend of
              traditional flavors and modern cuisine.
            </p>
            <p className="text-secondary">
              Our chefs use only the freshest ingredients, handpicked spices, and a touch of
              creativity to craft dishes that delight your taste buds.
            </p>
            <ul className="feature-list list-unstyled mt-4">
              <li>
                <i className="bi bi-check-circle-fill me-2"></i>
                Fresh, hygienic, and high-quality ingredients
              </li>
              <li>
                <i className="bi bi-check-circle-fill me-2"></i>
                A cozy, family-friendly atmosphere
              </li>
              <li>
                <i className="bi bi-check-circle-fill me-2"></i>
                Wide variety of vegetarian and non-vegetarian dishes
              </li>
              <li>
                <i className="bi bi-check-circle-fill me-2"></i>
                Exceptional service with a smile
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
