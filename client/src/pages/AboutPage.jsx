import { FiCheckCircle, FiClock, FiStar, FiUsers } from "react-icons/fi";
import { getImage } from "../assets/imageMap";

const ownerStats = [
  "Fresh ingredients used daily",
  "Wide variety of delicious dishes",
  "Friendly and welcoming dining experience",
];

const aboutHighlights = [
  "Fresh, hygienic, and high-quality ingredients",
  "A cozy, family-friendly atmosphere",
  "Wide variety of vegetarian and non-vegetarian dishes",
  "Exceptional service with a smile",
];

const valueCards = [
  {
    title: "Fresh Ingredients",
    description:
      "We carefully source fresh produce and quality ingredients every day for consistent flavor and nutrition.",
    Icon: FiCheckCircle,
  },
  {
    title: "Experienced Chefs",
    description:
      "Our chefs bring years of culinary expertise and creative presentation to every dish we serve.",
    Icon: FiStar,
  },
  {
    title: "Fast & Friendly Service",
    description:
      "Our team delivers quick, attentive service while making every guest feel welcome and valued.",
    Icon: FiClock,
  },
  {
    title: "Great Dining Experience",
    description:
      "Enjoy a stylish and comfortable dining space designed for families, friends, and special moments.",
    Icon: FiUsers,
  },
];

function AboutPage() {
  const ownerImage = getImage("vivek.jpg") || getImage("image.jpg");

  return (
    <main className="page-shell about-page">
      <section className="about-page-section owner-intro-section fade-up">
        <div className="container">
          <div className="owner-intro-grid">
            <div className="owner-intro-content">
              <p className="owner-intro-kicker mb-2">FROM THE OWNER</p>
              <h1 className="owner-intro-title mb-2">Vivek Sasumahanthi</h1>
              <p className="owner-intro-role">Owner of VR BITES</p>

              <p className="about-paragraph">
                Welcome to VR BITES. I am Vivek Sasumahanthi, the owner of this
                restaurant. My goal has always been simple - to create a place where
                people can enjoy delicious food, warm hospitality, and a comfortable
                dining atmosphere.
              </p>
              <p className="about-paragraph">
                At VR BITES, we focus on preparing every dish with fresh ingredients,
                authentic flavors, and great attention to detail. Our kitchen combines
                traditional recipes with modern touches to deliver meals that our guests
                truly enjoy.
              </p>
              <p className="about-paragraph">
                I believe that a restaurant should be more than just a place to eat.
                It should be a place where families gather, friends celebrate, and
                everyone leaves with a memorable experience.
              </p>
              <p className="about-paragraph mb-0">
                Every day, our team works hard to provide great food, friendly service,
                and a welcoming environment for every guest who visits VR BITES.
              </p>

              <ul className="owner-intro-stats list-unstyled mb-0 mt-4">
                {ownerStats.map((stat) => (
                  <li key={stat}>
                    <FiCheckCircle aria-hidden="true" />
                    <span>{stat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="owner-image-wrap">
              <img src={ownerImage} alt="Vivek Sasumahanthi - Owner of VR BITES" className="owner-image" />
            </div>
          </div>
        </div>
      </section>

      <section className="about-page-section about-hero-section">
        <div className="container">
          <div className="about-hero-grid">
            <div className="about-hero-image-wrap">
              <img src={getImage("aboutsec1.jpg")} alt="Interior view of VR BITES" className="about-hero-image" />
            </div>
            <div className="about-hero-content">
              <h2 className="section-title mb-2">About Us</h2>
              <h3 className="about-subtitle">Welcome to VR BITES</h3>
              <p className="about-paragraph">
                At VR BITES, we believe that food is more than just a meal - it is an
                experience. Founded with passion and dedication, our restaurant blends
                traditional flavors with modern culinary creativity to bring unforgettable
                dining moments to our guests.
              </p>
              <p className="about-paragraph">
                As the owner of VR BITES, my vision is to create a place where people can
                enjoy delicious food, warm hospitality, and a welcoming
                atmosphere. Every dish we serve is prepared with carefully selected
                ingredients and a commitment to quality.
              </p>
              <p className="about-paragraph">
                From classic comfort foods to modern gourmet creations, our menu is designed
                to satisfy every taste while maintaining the highest standards of freshness
                and flavor.
              </p>

              <ul className="about-feature-list list-unstyled">
                {aboutHighlights.map((item) => (
                  <li key={item}>
                    <FiCheckCircle aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="about-page-section about-story-section">
        <div className="container">
          <div className="about-story-grid">
            <div>
              <h3 className="section-title mb-3">Our Story</h3>
              <p className="about-paragraph">
                VR BITES started with a simple idea - to bring people together through great
                food. What began as a passion for cooking has grown into a restaurant known
                for its quality, creativity, and dedication to customer satisfaction.
              </p>
              <p className="about-paragraph mb-0">
                Our team works hard every day to ensure that every guest enjoys a memorable
                dining experience.
              </p>
            </div>
            <div className="about-story-image-wrap">
              <img src={getImage("abtsec21.jpg")} alt="Chef preparing dishes at VR BITES" className="about-story-image" />
            </div>
          </div>
        </div>
      </section>

      <section className="about-page-section about-why-section">
        <div className="container">
          <div className="text-center mb-5">
            <h3 className="section-title mb-2">Why Choose VR BITES</h3>
            <p className="section-sub mx-auto">
              We combine quality ingredients, culinary expertise, and warm service to create
              a dining experience you will always look forward to.
            </p>
          </div>
          <div className="about-card-grid">
            {valueCards.map(({ title, description, Icon }) => (
              <article key={title} className="about-value-card">
                <span className="about-value-icon" aria-hidden="true">
                  <Icon />
                </span>
                <h4>{title}</h4>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-page-section about-experience-section">
        <div className="container">
          <div className="about-experience-copy text-center">
            <h3 className="section-title mb-3">Restaurant Experience</h3>
            <p className="about-paragraph mx-auto mb-0">
              At VR BITES, every detail is designed to create a welcoming and enjoyable
              environment. Whether you are joining us for a casual meal, a family gathering,
              or a special celebration, we ensure every visit feels special.
            </p>
          </div>
          <div className="about-experience-image-wrap mt-4 mt-lg-5">
            <img src={getImage("sec1main.jpg")} alt="Dining experience at VR BITES" className="about-experience-image" />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AboutPage;
