import { FaCircleCheck, FaLeaf, FaTruckFast, FaUtensils } from "react-icons/fa6";
import whyChooseImage from "../assets/images/food image 24.jpg";

const benefits = [
  {
    icon: <FaLeaf aria-hidden="true" />,
    title: "Fresh Ingredients",
    description: "Every dish is prepared with handpicked produce and premium cuts.",
  },
  {
    icon: <FaUtensils aria-hidden="true" />,
    title: "Skilled Chefs",
    description: "Experienced chefs craft each plate with consistency and care.",
  },
  {
    icon: <FaTruckFast aria-hidden="true" />,
    title: "Fast Service",
    description: "Enjoy quick table service and reliable delivery in your area.",
  },
];

function WhyChooseUs() {
  return (
    <section id="why-choose-us" className="why-choose-section">
      <div className="container">
        <div className="text-center why-choose-heading">
          <p className="why-choose-kicker">Why Choose Us</p>
          <h2 className="why-choose-title">A Better Dining Experience, Every Time</h2>
          <p className="why-choose-lead">
            We combine authentic taste, attentive service, and a welcoming atmosphere so every
            meal feels special.
          </p>
        </div>

        <div className="row g-4 align-items-stretch why-choose-grid">
          <div className="col-lg-6 d-flex">
            <article className="why-choose-media-card h-100 w-100">
              <img
                src={whyChooseImage}
                alt="Delicious plated food served fresh"
                className="img-fluid why-choose-image"
              />
            </article>
          </div>

          <div className="col-lg-6 d-flex">
            <div className="why-choose-content text-center h-100 w-100">
            <div className="why-choose-list d-grid gap-3">
              {benefits.map((benefit) => (
                <article className="benefit-item" key={benefit.title}>
                  <div className="benefit-icon">{benefit.icon}</div>
                  <div className="benefit-copy">
                    <h3 className="h6 mb-1 d-flex align-items-center justify-content-center gap-2">
                      {benefit.title}
                      <FaCircleCheck className="benefit-check" aria-hidden="true" />
                    </h3>
                    <p className="text-secondary mb-0">{benefit.description}</p>
                  </div>
                </article>
              ))}
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
