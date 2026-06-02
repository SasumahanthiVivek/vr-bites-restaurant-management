import foodImage1 from "../assets/images/food image 1.jpg";
import foodImage2 from "../assets/images/food image 2.jpg";
import foodImage3 from "../assets/images/food image 3.jpg";
import foodImage4 from "../assets/images/food image 4.jpg";
import foodImage5 from "../assets/images/food image 5.jpg";
import foodImage6 from "../assets/images/food image 6.jpg";
import foodImage7 from "../assets/images/food image 7.jpg";
import foodImage8 from "../assets/images/food image 8.jpg";
import foodImage9 from "../assets/images/food image 9.jpg";
import foodImage10 from "../assets/images/food image 10.jpg";
import foodImage11 from "../assets/images/food image 11.jpg";
import foodImage12 from "../assets/images/food image 12.jpg";
import foodImage13 from "../assets/images/food image 13.jpg";
import foodImage14 from "../assets/images/food image 14.jpg";
import foodImage15 from "../assets/images/food image 15.jpg";
import foodImage16 from "../assets/images/food image 16.jpg";
import foodImage17 from "../assets/images/food image 17.jpg";
import foodImage18 from "../assets/images/food image 18.jpg";
import foodImage19 from "../assets/images/food image 19.jpg";
import foodImage20 from "../assets/images/food image 20.jpg";
import foodImage21 from "../assets/images/food image 21.jpg";
import foodImage22 from "../assets/images/food image 22.jpg";
import foodImage23 from "../assets/images/food image 23.jpg";
import foodImage24 from "../assets/images/food image 24.jpg";
import foodImage25 from "../assets/images/food image 25.jpg";
import foodImage26 from "../assets/images/food image 26.jpg";
import foodImage27 from "../assets/images/food image 27.jpg";
import foodImage28 from "../assets/images/food image 28.jpg";
import foodImage29 from "../assets/images/food image 29.jpg";
import foodImage30 from "../assets/images/food image 30.jpg";
import aboutPhoto from "../assets/images/image.jpg";
import logo from "../assets/images/logo.png";

export const navItems = [
  { id: "home", label: "Home", icon: "bi-house", path: "/" },
  { id: "menu", label: "Menu", icon: "bi-grid", path: "/menu" },
  { id: "about", label: "About", icon: "bi-info-circle", path: "/about" },
  { id: "book-table", label: "Book Table", icon: "bi-calendar2-check", path: "/book-table" },
];

export const heroImages = [
  foodImage1,
  foodImage2,
  foodImage3,
  foodImage4,
  foodImage5,
];

export const featuredItems = [
  {
    id: 1,
    slug: "farm-fresh-power-bowl",
    title: "Farm Fresh Power Bowl",
    image: foodImage6,
    shortDescription:
      "A nutritious bowl filled with seasonal vegetables, grains, avocado, eggs, and fresh herbs for a balanced and healthy meal.",
    description:
      "A colorful power bowl crafted with farm-fresh vegetables, wholesome grains, creamy avocado, eggs, and aromatic herbs. It is a nourishing choice packed with flavor and texture.",
    prepTime: "15-18 min",
    price: "$16.90",
    spiceLevel: "Mild",
    highlights: ["Fresh vegetables", "High-protein eggs", "Balanced nutrition"],
    ingredients: ["Seasonal vegetables", "Whole grains", "Avocado", "Eggs"],
  },
  {
    id: 2,
    slug: "royal-indian-thali",
    title: "Royal Indian Thali",
    image: foodImage11,
    shortDescription:
      "A traditional Indian platter featuring flavorful curries, crispy starters, naan bread, and aromatic spices.",
    description:
      "Our royal thali brings together comforting Indian flavors in one complete platter with rich curries, crisp starters, soft naan, and fragrant spices for a satisfying meal.",
    prepTime: "20-24 min",
    price: "$19.90",
    spiceLevel: "Medium",
    highlights: ["Traditional flavors", "Assorted curries", "Fresh naan bread"],
    ingredients: ["Indian curries", "Crispy starters", "Naan", "Signature spice blend"],
  },
  {
    id: 3,
    slug: "healthy-veggie-quinoa-bowl",
    title: "Healthy Veggie Quinoa Bowl",
    image: foodImage14,
    shortDescription:
      "A wholesome quinoa bowl topped with roasted vegetables, fresh greens, and house seasoning.",
    description:
      "A vibrant quinoa bowl loaded with roasted seasonal vegetables, crisp greens, and our house seasoning. It is light, wholesome, and full of natural flavor.",
    prepTime: "16-20 min",
    price: "$17.80",
    spiceLevel: "Mild",
    highlights: ["Protein-rich quinoa", "Roasted vegetables", "House seasoning"],
    ingredients: ["Quinoa", "Broccoli", "Carrots", "Mixed roasted vegetables"],
  },
];

export const menuItems = [
  [
    "Penne Arrabbiata Pasta",
    foodImage1,
    "$14.67",
    "Classic Italian penne pasta tossed in a spicy tomato garlic sauce, finished with fresh herbs and olive oil for a bold and flavorful taste.",
  ],
  [
    "Tomato Basil Penne Pasta",
    foodImage2,
    "$12.89",
    "Delicious penne pasta cooked with ripe tomatoes, fresh basil, and light herbs, creating a simple yet rich Mediterranean flavor.",
  ],
  [
    "Butter Chicken Curry",
    foodImage3,
    "$11.99",
    "Tender chicken pieces simmered in a creamy tomato-based curry with aromatic spices, delivering a rich and comforting Indian classic.",
  ],
  [
    "Garden Fresh Veggie Bowl",
    foodImage4,
    "$14.88",
    "A healthy bowl of fresh seasonal vegetables, herbs, and light dressing, perfect for a refreshing and nutritious meal.",
  ],
  [
    "Roasted Herb Chicken Platter",
    foodImage5,
    "$10.68",
    "Juicy roasted chicken served with golden potatoes, grilled vegetables, and fresh herbs for a hearty and flavorful meal.",
  ],
  [
    "Fresh Gourmet Ingredient Bowl",
    foodImage6,
    "$18.8",
    "A vibrant selection of fresh vegetables, grains, fruits, and premium ingredients carefully arranged for a nutritious and balanced dish.",
  ],
  [
    "Classic Family Feast Platter",
    foodImage7,
    "$12.98",
    "A generous platter featuring roasted chicken, mixed vegetables, and flavorful side dishes, perfect for sharing and enjoying together.",
  ],
  [
    "Loaded Sweet Potato Fries",
    foodImage8,
    "$10.88",
    "Crispy sweet potato fries topped with creamy sauce, fresh herbs, and savory toppings for a delicious comfort-style dish.",
  ],
  [
    "Classic Maple Pancake Stack",
    foodImage9,
    "$16.87",
    "Fluffy golden pancakes layered with rich maple syrup and topped with fresh berries, served with a side of whipped cream.",
  ],
  [
    "Gourmet Burger & Fries Combo",
    foodImage10,
    "$12.78",
    "Juicy grilled beef burger with fresh lettuce, tomato, and cheese, served with crispy golden fries and house dipping sauces.",
  ],
  [
    "Traditional Indian Thali Feast",
    foodImage11,
    "$21.87",
    "A complete Indian platter featuring aromatic curries, naan bread, rice, and flavorful side dishes for a rich dining experience.",
  ],
  [
    "Chef's Signature Multi-Course Platter",
    foodImage12,
    "$11.62",
    "An assortment of chef-crafted dishes including appetizers, mains, and sides, offering a diverse and flavorful tasting experience.",
  ],
  [
    "Crispy Fried Chicken Drumsticks",
    foodImage13,
    "$14.67",
    "Golden crispy chicken drumsticks seasoned with spices and served with fresh salad and crunchy fries for a satisfying meal.",
  ],
  [
    "Healthy Power Veggie Bowl",
    foodImage14,
    "$11.32",
    "A colorful bowl packed with roasted vegetables, grains, and fresh greens, perfect for a nutritious and balanced meal.",
  ],
  [
    "Caramel Berry Pancake Stack",
    foodImage15,
    "$15.23",
    "Soft fluffy pancakes topped with caramel drizzle, fresh berries, and whipped cream for a delightful sweet treat.",
  ],
  [
    "Butter Chicken with Garlic Naan",
    foodImage16,
    "$6.87",
    "Creamy butter chicken curry cooked with aromatic spices, served hot with soft garlic naan bread.",
  ],
  [
    "Mediterranean Fresh Salad Bowl",
    foodImage17,
    "$8.78",
    "A refreshing mix of crisp vegetables, olives, herbs, and light dressing, offering a healthy and flavorful Mediterranean salad.",
  ],
  [
    "Crispy Vegetable Samosa",
    foodImage18,
    "$4.54",
    "Golden fried pastry filled with spiced potatoes and vegetables, served with tangy chutney for a classic Indian snack.",
  ],
  [
    "Traditional Indian Street Food Platter",
    foodImage19,
    "$5.22",
    "A flavorful assortment of Indian street-style dishes served with chutneys and spices for an authentic taste experience.",
  ],
  [
    "Fresh Farm Produce Basket",
    foodImage20,
    "$2.89",
    "A vibrant selection of seasonal fruits, vegetables, and fresh produce sourced directly from local farms.",
  ],
  [
    "Double Cheese Burger & Fries",
    foodImage21,
    "$9.78",
    "A juicy double beef burger layered with melted cheese, fresh lettuce, and special sauce, served with crispy golden fries.",
  ],
  [
    "Mediterranean Mezze Platter",
    foodImage22,
    "$7.88",
    "A vibrant assortment of Mediterranean dishes including dips, fresh vegetables, pita bread, and flavorful side plates.",
  ],
  [
    "Classic American Cheese Burger",
    foodImage23,
    "$5.56",
    "A grilled beef patty topped with melted cheese, fresh lettuce, tomato, and house sauce inside a toasted sesame bun.",
  ],
  [
    "Gourmet Sandwich & Snack Board",
    foodImage24,
    "$9.65",
    "A delicious selection of sandwiches, breads, fruits, and snacks arranged for a satisfying and shareable platter.",
  ],
  [
    "Fresh Berry Smoothie Bowl",
    foodImage25,
    "$9.78",
    "A colorful smoothie bowl topped with fresh berries, kiwi, granola, and tropical fruits for a refreshing and healthy treat.",
  ],
  [
    "Garden Fresh Vegetable Selection",
    foodImage26,
    "$14.77",
    "A vibrant mix of farm-fresh vegetables including tomatoes, peppers, and greens, perfect for healthy and nutritious meals.",
  ],
  [
    "Balanced Nutrition Platter",
    foodImage27,
    "$7.88",
    "A wholesome platter featuring grains, proteins, vegetables, and fruits designed for a balanced and healthy meal.",
  ],
  [
    "Traditional Indian Thali Meal",
    foodImage28,
    "$12.76",
    "A classic Indian thali served with rice, naan bread, flavorful curries, and traditional side dishes for a complete dining experience.",
  ],
  [
    "Chef's Special Brunch Platter",
    foodImage29,
    "$13.23",
    "A delightful assortment of breakfast favorites including eggs, toast, fresh salad, and gourmet sides, perfect for a relaxing brunch.",
  ],
  [
    "Ultimate Gourmet Burger Combo",
    foodImage30,
    "$14.62",
    "A premium grilled burger stacked with fresh lettuce, tomato, cheese, and house sauce, served with crispy fries and refreshing beverages.",
  ],
].map(([name, image, price, description], index) => ({
  id: index + 1,
  name,
  image,
  price,
  description,
  icon: "bi-fire",
}));

export const aboutImage = aboutPhoto;
export const authorLogo = logo;
