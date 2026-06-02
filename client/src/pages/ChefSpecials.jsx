import { getImage } from "../assets/imageMap";

const chefSpecialDishes = [
  {
    name: "Creamy Truffle Mushroom Penne",
    description:
      "Penne pasta tossed in a rich truffle-infused cream sauce with sauteed wild mushrooms, finished with parmesan and fresh herbs.",
    image: getImage("menu-pasta.jpg"),
  },
  {
    name: "Smoked Herb Chicken Plate",
    description:
      "Char-grilled chicken breast marinated in house herbs and smoked spices, served with roasted vegetables and a light herb omelette.",
    image: getImage("menu-platter.jpg"),
  },
  {
    name: "Burrata Pesto Margherita Pizza",
    description:
      "Stone-baked artisan pizza topped with creamy burrata, basil pesto, cherry tomatoes, and extra virgin olive oil.",
    image: getImage("menu-pizza.jpg"),
  },
  {
    name: "Royal Tandoori Platter",
    description:
      "A chef's selection of tandoori grilled meats and signature curries served with warm naan, aromatic spices, and traditional chutneys.",
    image: getImage("food image 11.jpg"),
  },
];

function ChefSpecials() {
  return (
    <main className="page-shell">
      <section className="menu-page-section chef-specials-section">
        <div className="container">
          <div className="text-center menu-heading-wrap mx-auto mb-5">
            <h1 className="section-title menu-title-main">Chef&apos;s Signature Dishes</h1>
            <p className="menu-subtext text-secondary mb-0">
              Our chefs prepare a curated selection of signature plates using premium ingredients, refined techniques,
              and balanced flavors.
            </p>
          </div>

          <div className="row g-4">
            {chefSpecialDishes.map((dish) => (
              <div key={dish.name} className="col-sm-6 col-lg-3">
                <article className="menu-card h-100">
                  <img src={dish.image} alt={dish.name} />
                  <div className="menu-card-body p-3">
                    <h2 className="h5 menu-title mb-2">{dish.name}</h2>
                    <p className="menu-desc text-secondary mb-0">{dish.description}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ChefSpecials;
