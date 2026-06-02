function FoodCard({ image, name, ordersCount, price, showOrderAgain = false }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  return (
    <article className="db-card db-food-card">
      <img src={image} alt={name} className="db-food-image" />
      <div className="db-food-body">
        <h3>{name}</h3>
        {price ? <p className="db-food-price">{formatCurrency(price)}</p> : null}
        {ordersCount ? <p className="db-food-meta">{ordersCount}</p> : null}
        {showOrderAgain ? (
          <button type="button" className="db-pill-btn">
            Order Again
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default FoodCard;
