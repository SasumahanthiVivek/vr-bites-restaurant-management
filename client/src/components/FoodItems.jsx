import item1 from "../assets/images/item1.jpg";
import item2 from "../assets/images/food image 17.jpg";
import item3 from "../assets/images/item3.jpg";

function FoodItems() {
  return (
    <div className="food-items">
      <div className="item">
        <div>
          <img src={item1} alt="Spicy Veg Noodles" />
        </div>
        <h3>Spicy Veg Noodles</h3>
        <p>
          Tossed with fresh veggies and bold flavors, our spicy veg noodles are a customer favorite
        </p>
        <button className="white_btn">see menu</button>
      </div>
      <div className="item">
        <div>
          <img src={item2} alt="Cheesy Burger Meal" />
        </div>
        <h3>Cheesy Burger Meal</h3>
        <p>
          A juicy burger stacked with cheese, fries, and chilled Pepsi - the perfect hunger buster
          A cheesy burger combo with fries
        </p>
        <button className="red_btn">see menu</button>
      </div>
      <div className="item">
        <div>
          <img src={item3} alt="Grilled Fish Platter" />
        </div>
        <h3>Grilled Fish Platter</h3>
        <p>
          Served on a banana leaf with onions and lemon, this coastal-style grilled fish is rich in
          taste and aroma
        </p>
        <button className="white_btn">see menu</button>
      </div>
    </div>
  );
}

export default FoodItems;
