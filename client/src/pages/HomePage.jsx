import HeroSection from "../components/HeroSection";
import FeaturedFood from "../components/FeaturedFood";
import WhyChooseUs from "../components/WhyChooseUs";
import PopularFood from "../components/PopularFood";
import CustomerFeedback from "../components/CustomerFeedback";
import Newsletter from "../components/Newsletter";

function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturedFood />
      <WhyChooseUs />
      <PopularFood />
      <CustomerFeedback />
      <Newsletter />
    </main>
  );
}

export default HomePage;
