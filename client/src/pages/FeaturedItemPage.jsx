import { Link, Navigate, useParams } from "react-router-dom";
import { featuredItems } from "../data/siteData";

function FeaturedItemPage() {
  const { slug } = useParams();
  const item = featuredItems.find((entry) => entry.slug === slug);

  if (!item) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="page-shell featured-detail-page">
      <section className="featured-detail-section">
        <div className="container">
          <div className="featured-detail-topline mb-4">
            <span>Featured Signature Dish</span>
          </div>

          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <div className="featured-detail-copy">
                <span className="featured-detail-kicker">Chef Signature</span>
                <h1 className="featured-detail-title mt-2 mb-3">{item.title}</h1>
                <p className="featured-detail-desc mb-4">{item.description}</p>

                <div className="featured-detail-tags mb-4">
                  {item.highlights.map((tag) => (
                    <span key={tag} className="featured-detail-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="featured-detail-meta mb-4">
                  <div className="featured-detail-meta-item">
                    <span>Price</span>
                    <strong>{item.price}</strong>
                  </div>
                  <div className="featured-detail-meta-item">
                    <span>Prep Time</span>
                    <strong>{item.prepTime}</strong>
                  </div>
                  <div className="featured-detail-meta-item">
                    <span>Spice</span>
                    <strong>{item.spiceLevel}</strong>
                  </div>
                </div>

                <Link to="/" className="btn btn-outline-brand">
                  Back to Home
                </Link>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="featured-detail-image-wrap">
                <img src={item.image} alt={item.title} className="featured-detail-image" />
              </div>
            </div>
          </div>

          <div className="row g-4 mt-2">
            <div className="col-md-6">
              <article className="featured-detail-card h-100">
                <h2 className="h4 mb-3">Dish Highlights</h2>
                <ul className="featured-detail-list mb-0">
                  {item.highlights.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="col-md-6">
              <article className="featured-detail-card h-100">
                <h2 className="h4 mb-3">Key Ingredients</h2>
                <ul className="featured-detail-list mb-0">
                  {item.ingredients.map((ingredient) => (
                    <li key={ingredient}>{ingredient}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default FeaturedItemPage;
