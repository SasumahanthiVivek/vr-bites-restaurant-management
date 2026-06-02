import heroFoodImage from "../assets/images/food image 1.jpg";

function Hero() {
  return (
    <div className="main_slide">
      <div>
        <h1>
          Enjoy <span>Delicious Food</span> in your Healthy Life.
        </h1>
        <p>
          VR BITES serves delicious, mouth-watering dishes made with love. From starters to
          desserts, every bite is a flavorful experience, crafted with care, passion, and the
          freshest ingredients.
        </p>
        <button className="red_btn">
          Visit Now <i className="fa-solid fa-arrow-right-long"></i>
        </button>
      </div>
      <div>
        <img src={heroFoodImage} alt="food image" style={{ width: "100%", height: "auto" }} />
      </div>
    </div>
  );
}

export default Hero;
