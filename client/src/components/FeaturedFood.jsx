import { Link } from "react-router-dom";
import { featuredItems } from "../data/siteData";

function FeaturedFood() {
  return (
    <>
      <section id="featured-food" className="featured-food-section">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-title mb-2">Featured Food Items</h2>
            <p className="section-sub mx-auto">
              Signature dishes prepared by our chefs with premium ingredients and bold flavors.
            </p>
          </div>

          <div className="row g-4">
            {featuredItems.map((item) => (
              <div className="col-md-6 col-lg-4" key={item.title}>
                <article className="card h-100 featured-card border-0">
                  <div className="featured-card-media">
                    <img src={item.image} className="card-img-top" alt={item.title} />
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h3 className="h5 mb-2">{item.title}</h3>
                    <p className="text-secondary mb-4">{item.shortDescription}</p>
                    <Link
                      to={`/featured/${item.slug}`}
                      className="btn btn-brand featured-details-btn mt-auto align-self-start"
                    >
                      View Details
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default FeaturedFood;
