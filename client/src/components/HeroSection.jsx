import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { heroImages } from "../data/siteData";

function HeroSection() {
  const AUTO_SLIDE_INTERVAL_MS = 5000;
  const slides = useMemo(
    () => [
      {
        id: "creamy-penne-slide",
        image: heroImages[0],
        title: "Creamy Penne Pasta",
        description: "Italian penne pasta tossed in creamy tomato garlic sauce.",
      },
      {
        id: "italian-herb-slide",
        image: heroImages[1],
        title: "Italian Herb Pasta Bowl",
        description: "Classic Italian pasta with herbs, tomatoes, and olive oil.",
      },
      {
        id: "garden-veggie-slide",
        image: heroImages[3],
        title: "Garden Fresh Veggie Bowl",
        description: "Healthy vegetable bowl with broccoli, carrots, zucchini, and grains.",
      },
      {
        id: "roast-chicken-slide",
        image: heroImages[4],
        title: "Roast Chicken Dinner Plate",
        description: "Roasted chicken served with potatoes, peas, and seasonal vegetables.",
      },
    ],
    []
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, AUTO_SLIDE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [AUTO_SLIDE_INTERVAL_MS, isPaused, slides.length]);

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section id="home" className="hero">
      <div className="container">
        <div className="row align-items-center g-4 hero-container">
          <div className="col-lg-6 fade-up hero-text">
            <p className="hero-kicker mb-2">Are you hungry?</p>
            <h1 className="mb-3">Enjoy Delicious Food in your Healthy Life.</h1>
            <p className="text-secondary mb-4">
              Don&apos;t wait. Let start to order food now. VR BITES serves mouth-watering
              dishes made with love, passion, and the freshest ingredients.
            </p>
            <div className="d-flex flex-wrap gap-2 mb-4">
              <span className="chip">Traditional Flavors</span>
              <span className="chip">Modern Cuisine</span>
              <span className="chip">Family Friendly</span>
            </div>
            <div className="d-flex gap-2">
              <Link to="/menu-discovery" className="btn btn-brand">
                Check Out Menu <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>

            <div className="d-flex flex-wrap gap-3 mt-4">
              <div className="hero-stat">
                <i className="bi bi-star-fill"></i>
                <span>4.8 Guest Rating</span>
              </div>
              <div className="hero-stat">
                <i className="bi bi-truck"></i>
                <span>Fast Delivery</span>
              </div>
              <div className="hero-stat">
                <i className="bi bi-clock-history"></i>
                <span>Open 10:00 - 23:00</span>
              </div>
            </div>
          </div>

          <div className="col-lg-6 fade-up hero-media">
            <article className="hero-card p-3 p-md-4">
              <div
                className="hero-slider"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <div className="hero-image-stage" aria-live="polite">
                  {slides.map((slide, index) => (
                    <figure
                      className={`hero-slide ${slide.id} ${index === activeIndex ? "is-active" : ""}`}
                      key={slide.image}
                      aria-hidden={index !== activeIndex}
                    >
                      <img
                        src={slide.image}
                        className="hero-image"
                        alt={slide.title}
                        loading="lazy"
                      />
                    </figure>
                  ))}
                  <button
                    className="hero-carousel-control hero-slider-arrow hero-slider-arrow-prev"
                    type="button"
                    onClick={goToPrev}
                    aria-label="Previous slide"
                  >
                    <i className="bi bi-chevron-left" aria-hidden="true"></i>
                  </button>
                  <button
                    className="hero-carousel-control hero-slider-arrow hero-slider-arrow-next"
                    type="button"
                    onClick={goToNext}
                    aria-label="Next slide"
                  >
                    <i className="bi bi-chevron-right" aria-hidden="true"></i>
                  </button>
                </div>
                <div className="hero-food-title-wrap">
                  <h3 className="hero-slide-title mb-1">{slides[activeIndex].title}</h3>
                  <p className="hero-slide-description mb-0">{slides[activeIndex].description}</p>
                </div>
                <div className="hero-slider-dots" role="tablist" aria-label="Hero image slider">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.title}
                      type="button"
                      className={`hero-slider-dot ${index === activeIndex ? "is-active" : ""}`}
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
