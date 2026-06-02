import {
  FaAward,
  FaChampagneGlasses,
  FaStar,
  FaUtensils,
} from "react-icons/fa6";
import customer1 from "../assets/images/chef2.jpg";
import customer2 from "../assets/images/chef3.jpg";
import customer3 from "../assets/images/chef4.jpg";
import customer4 from "../assets/images/chef5.jpg";
import customer5 from "../assets/images/chef1.jpg";
import customer6 from "../assets/images/eatingpizza.jpg";
import TestimonialCard from "./TestimonialCard";

const testimonials = [
  {
    image: customer1,
    name: "Sophia Carter",
    role: "Food Blogger",
    review:
      "Every plate arrived with beautiful presentation and bold, balanced flavors. The staff made us feel genuinely welcomed throughout the evening.",
    badges: [
      { icon: FaStar, label: "4.9 Rating" },
      { icon: FaAward, label: "Top Service" },
      { icon: FaUtensils, label: "Frequent Visitor" },
    ],
  },
  {
    image: customer2,
    name: "Daniel Price",
    role: "Regular Guest",
    review:
      "I keep coming back for the consistency. From appetizers to mains, quality is always excellent and the dining atmosphere feels refined.",
    badges: [
      { icon: FaStar, label: "4.8 Rating" },
      { icon: FaAward, label: "Top Service" },
      { icon: FaChampagneGlasses, label: "Weekend Favorite" },
    ],
  },
  {
    image: customer3,
    name: "Mia Robertson",
    role: "Food Critic",
    review:
      "A standout culinary experience. The menu is thoughtful, the ingredients are fresh, and each dish has a clear, memorable identity.",
    badges: [
      { icon: FaStar, label: "4.9 Rating" },
      { icon: FaAward, label: "Top Service" },
      { icon: FaUtensils, label: "Chef's Table Guest" },
    ],
  },
  {
    image: customer4,
    name: "Noah Bennett",
    role: "Business Traveler",
    review:
      "Perfect place for client dinners. Quiet elegance, attentive staff, and dishes that are both comforting and sophisticated.",
    badges: [
      { icon: FaStar, label: "4.7 Rating" },
      { icon: FaAward, label: "Top Service" },
      { icon: FaChampagneGlasses, label: "Premium Ambience" },
    ],
  },
  {
    image: customer5,
    name: "Olivia Hayes",
    role: "Culinary Enthusiast",
    review:
      "The flavors feel handcrafted and intentional. Every course was paced perfectly, and the staff recommended pairings that elevated the meal.",
    badges: [
      { icon: FaStar, label: "4.9 Rating" },
      { icon: FaAward, label: "Top Service" },
      { icon: FaUtensils, label: "Frequent Visitor" },
    ],
  },
  {
    image: customer6,
    name: "Ethan Cole",
    role: "Weekend Diner",
    review:
      "A polished dining experience with comforting dishes and premium presentation. The ambiance is warm, calm, and perfect for long dinners.",
    badges: [
      { icon: FaStar, label: "4.8 Rating" },
      { icon: FaAward, label: "Top Service" },
      { icon: FaChampagneGlasses, label: "Guest Favorite" },
    ],
  },
];

function CustomerFeedback() {
  return (
    <section id="customer-feedback" className="customer-feedback-section">
      <div className="container">
        <div className="feedback-heading text-center">
          <h2 className="feedback-title mb-0">What Our Guests Say</h2>
          <p className="feedback-kicker mb-0">CUSTOMER FEEDBACK</p>
          <p className="feedback-intro mb-0">
            Discover how our guests describe their dining experience, from warm hospitality and
            attentive service to dishes crafted with care and flavor.
          </p>
        </div>

        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CustomerFeedback;
