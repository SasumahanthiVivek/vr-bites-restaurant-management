import popular1 from "../assets/images/food image 17.jpg";
import popular2 from "../assets/images/food image 18.jpg";
import popular3 from "../assets/images/food image 19.jpg";
import popular4 from "../assets/images/food image 23.jpg";

const popularItems = [
  {
    image: popular1,
    name: "Garden Fresh Veggie Salad",
    description:
      "A refreshing salad made with crisp seasonal vegetables, avocado, olives, and house dressing.",
    price: "$12.99",
  },
  {
    image: popular2,
    name: "Crispy Vegetable Samosa",
    description:
      "Golden fried samosas stuffed with spiced potatoes and vegetables, served with tangy chutney.",
    price: "$8.50",
  },
  {
    image: popular3,
    name: "Traditional Indian Curry Platter",
    description:
      "A flavorful selection of authentic Indian curries served with naan bread and aromatic spices.",
    price: "$16.25",
  },
  {
    image: popular4,
    name: "Ultimate Gourmet Cheeseburger",
    description:
      "Juicy grilled beef patty layered with melted cheese, fresh lettuce, tomatoes, and house sauce.",
    price: "$15.75",
  },
];

function PopularFood() {
  return (
    <section id="popular-food" className="popular-food-section">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="section-title mb-2">Popular Food Items</h2>
          <p className="section-sub mx-auto">
            Favorites our guests keep coming back for, served hot and full of flavor.
          </p>
        </div>

        <div className="row g-4">
          {popularItems.map((item) => (
            <div className="col-6 col-lg-3" key={item.name}>
              <article className="card h-100 popular-card border-0">
                <div className="popular-card-media">
                  <img src={item.image} className="card-img-top" alt={item.name} />
                </div>
                <div className="card-body popular-card-body">
                  <h3 className="h6 mb-2 popular-card-title">{item.name}</h3>
                  <p className="popular-card-desc mb-3">{item.description}</p>
                  <p className="popular-price mb-0 mt-auto">{item.price}</p>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PopularFood;
