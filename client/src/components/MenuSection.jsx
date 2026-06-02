import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { menuItems as staticMenuItems } from "../data/siteData";
import { isAdminEmail } from "../auth/authLogic";
import { apiRequest } from "../apiClient";

const initialOrderData = {
  customerName: "",
  phone: "",
  deliveryAddress: "",
  quantity: 1,
  specialNotes: "",
};

function parsePrice(priceValue) {
  return Number(String(priceValue || "").replace(/[^\d.]/g, "")) || 0;
}

function MenuSection() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const [activeItem, setActiveItem] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [formData, setFormData] = useState(initialOrderData);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [menuItems, setMenuItems] = useState(staticMenuItems);
  const searchWrapperRef = useRef(null);

  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const isAdmin = useMemo(() => isAdminEmail(userEmail), [userEmail]);
  const normalizedSearch = searchQuery.trim().toLowerCase();

  // Fetch live menu from database, fall back to static data if API fails
  useEffect(() => {
    apiRequest("/api/menu")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Map DB fields to match the shape expected by menu rendering
          const mapped = data
            .filter((item) => item.availability !== false)
            .map((item) => ({
              id: item.id || item._id,
              name: item.name,
              description: item.description || "",
              price: item.price,
              image: item.image || "",
              category: item.category || "General",
            }));
          setMenuItems(mapped);
        }
      })
      .catch(() => {
        // API unavailable — keep static data as fallback
      });
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!searchWrapperRef.current?.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const resetOrderForm = () => {
    setFormData(initialOrderData);
    setErrors({});
  };

  const openOrderFlow = (item) => {
    if (isAdmin) {
      return;
    }

    if (!isSignedIn) {
      setShowLoginModal(true);
      return;
    }

    setActiveItem(item);
    setShowSummary(false);
    resetOrderForm();
  };

  const closeOrderForm = () => {
    setActiveItem(null);
    setShowSummary(false);
    resetOrderForm();
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "phone" ? value.replace(/\D/g, "").slice(0, 15) : value;

    setFormData((current) => ({ ...current, [name]: nextValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateOrderForm = () => {
    const nextErrors = {};
    const trimmedName = formData.customerName.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.deliveryAddress.trim();
    const parsedQuantity = Number(formData.quantity);

    if (!trimmedName || trimmedName.length < 3) {
      nextErrors.customerName = "Please enter your full name (minimum 3 characters).";
    }

    if (!/^\d{10,15}$/.test(trimmedPhone)) {
      nextErrors.phone = "Please enter a valid phone number (10-15 digits).";
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 10) {
      nextErrors.quantity = "Quantity must be between 1 and 10.";
    }

    if (!trimmedAddress || trimmedAddress.length < 10) {
      nextErrors.deliveryAddress = "Delivery address must be at least 10 characters long.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleOrderSubmit = (event) => {
    event.preventDefault();
    if (!activeItem) {
      return;
    }

    if (!validateOrderForm()) {
      return;
    }

    setShowSummary(true);
  };

  const orderSummary = useMemo(() => {
    if (!activeItem) {
      return null;
    }

    const quantity = Number(formData.quantity || 1);
    const price = parsePrice(activeItem.price);
    const totalPrice = Number((quantity * price).toFixed(2));

    return {
      foodName: activeItem.name,
      foodImage: activeItem.image,
      quantity,
      price,
      totalPrice,
      userEmail,
      customerName: formData.customerName.trim(),
      phone: formData.phone.trim(),
      deliveryAddress: formData.deliveryAddress.trim(),
      specialNotes: formData.specialNotes.trim(),
    };
  }, [activeItem, formData, userEmail]);

  const filteredMenuItems = useMemo(() => {
    if (!normalizedSearch) {
      return menuItems;
    }

    const startsWithMatches = [];
    const containsMatches = [];

    menuItems.forEach((item) => {
      const itemName = item.name.toLowerCase();
      if (itemName.startsWith(normalizedSearch)) {
        startsWithMatches.push(item);
        return;
      }

      if (itemName.includes(normalizedSearch)) {
        containsMatches.push(item);
      }
    });

    return [...startsWithMatches, ...containsMatches];
  }, [normalizedSearch]);

  const suggestions = useMemo(() => filteredMenuItems.slice(0, 6), [filteredMenuItems]);

  const showSuggestions = isSearchFocused && normalizedSearch.length > 0;

  return (
    <section id="menu" className="menu-page-section">
      <div className="container">
        <div className="mb-5 menu-heading-wrap">
          <p className="menu-kicker mb-2">Chef Curated Menu</p>
          <h2 className="section-title menu-title-main">Food Menu</h2>
          <p className="section-sub mb-0 menu-subtext">
            Loved by foodies and crafted with passion. Explore your complete menu with modern cards.
          </p>
        </div>

        <div className="menu-search-wrap mb-4" ref={searchWrapperRef}>
          <label className="menu-search-label" htmlFor="menu-search-input">Find your dish quickly</label>
          <div className="menu-search-field">
            <i className="bi bi-search menu-search-icon" aria-hidden="true"></i>
            <input
              id="menu-search-input"
              type="search"
              className="form-control menu-search-input"
              placeholder="Search food by name (e.g. chicken, pasta, pizza)"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsSearchFocused(true);
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                className="menu-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchFocused(false);
                }}
                aria-label="Clear search"
              >
                <span className="menu-search-clear-mark" aria-hidden="true">x</span>
              </button>
            ) : null}
          </div>

          {showSuggestions ? (
            <div className="menu-search-suggestions" role="listbox" aria-label="Food suggestions">
              {suggestions.length ? (
                suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="menu-search-suggestion-item"
                    onClick={() => {
                      setSearchQuery(item.name);
                      setIsSearchFocused(false);
                    }}
                  >
                    <span>{item.name}</span>
                    <strong>{item.price}</strong>
                  </button>
                ))
              ) : (
                <p className="menu-search-empty mb-0">
                  Sorry, this item is not in our menu right now. We will add it very soon.
                </p>
              )}
            </div>
          ) : null}
        </div>

        {normalizedSearch && filteredMenuItems.length === 0 ? (
          <div className="menu-search-no-results" role="status" aria-live="polite">
            <h6>No matching dish found</h6>
            <p className="mb-0">
              Sorry, this item is not available now. We will add it very soon.
            </p>
          </div>
        ) : null}

        <div className="row g-4">
          {filteredMenuItems.map((item) => (
            <div className="col-sm-6 col-lg-4 col-xl-3" key={item.id}>
              <article className="menu-card h-100">
                <img src={item.image} alt={item.name} />
                <div className="p-3 menu-card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="mb-1 menu-title">{item.name}</h6>
                    <i className={`bi ${item.icon} text-danger`}></i>
                  </div>
                  <p className="text-secondary small mb-3 menu-desc">
                    {item.description || "Signature VR BITES flavor with fresh ingredients."}
                  </p>
                  {!isAdmin ? (
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="menu-price">{item.price}</span>
                      <button
                        className="btn btn-sm btn-outline-brand menu-order-btn"
                        onClick={() => openOrderFlow(item)}
                        title="Book this item now"
                      >
                        Book Now
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      {activeItem && !showSummary ? (
        <div className="order-modal-backdrop" role="dialog" aria-modal="true">
          <div className="order-modal-card">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <p className="menu-kicker mb-1">Order Food</p>
                <h3 className="h5 mb-1">Selected Item: {activeItem.name}</h3>
                <p className="order-modal-sub mb-0">Please fill your details to continue to payment.</p>
              </div>
              <button className="btn btn-sm order-close-btn" onClick={closeOrderForm} type="button">
                Close
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="row g-2 order-modal-form">
              <div className="col-12">
                <label className="form-label mb-1" htmlFor="order-name">Full Name</label>
                <input
                  id="order-name"
                  name="customerName"
                  className="form-control"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                />
                {errors.customerName ? <p className="order-form-error mb-0">{errors.customerName}</p> : null}
              </div>

              <div className="col-md-6">
                <label className="form-label mb-1" htmlFor="order-phone">Phone Number</label>
                <input
                  id="order-phone"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength={15}
                  required
                />
                {errors.phone ? <p className="order-form-error mb-0">{errors.phone}</p> : null}
              </div>

              <div className="col-md-6">
                <label className="form-label mb-1" htmlFor="order-qty">Quantity</label>
                <input
                  id="order-qty"
                  name="quantity"
                  type="number"
                  min="1"
                  max="10"
                  className="form-control"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
                {errors.quantity ? <p className="order-form-error mb-0">{errors.quantity}</p> : null}
              </div>

              <div className="col-12">
                <label className="form-label mb-1" htmlFor="order-address">Delivery Address</label>
                <textarea
                  id="order-address"
                  name="deliveryAddress"
                  className="form-control"
                  rows="3"
                  value={formData.deliveryAddress}
                  onChange={handleInputChange}
                  required
                ></textarea>
                {errors.deliveryAddress ? <p className="order-form-error mb-0">{errors.deliveryAddress}</p> : null}
              </div>

              <div className="col-12">
                <label className="form-label mb-1" htmlFor="order-notes">Special Notes (Optional)</label>
                <textarea
                  id="order-notes"
                  name="specialNotes"
                  className="form-control"
                  rows="2"
                  value={formData.specialNotes}
                  onChange={handleInputChange}
                  placeholder="Any allergy, spice level, or packaging request"
                ></textarea>
              </div>

              <div className="col-12 d-flex justify-content-end">
                <button className="btn btn-brand order-confirm-btn" type="submit">Continue</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {activeItem && showSummary && orderSummary ? (
        <div className="order-modal-backdrop" role="dialog" aria-modal="true">
          <div className="order-modal-card status-modal-card">
            <p className="menu-kicker mb-1">Order Summary</p>
            <h3 className="h5 mb-2">Review your order</h3>
            <div className="status-modal-block">
              <p><strong>Food name:</strong> {orderSummary.foodName}</p>
              <p><strong>Quantity:</strong> {orderSummary.quantity}</p>
              <p><strong>Price:</strong> ${orderSummary.price.toFixed(2)}</p>
              <p><strong>Delivery address:</strong> {orderSummary.deliveryAddress}</p>
              <p><strong>Total price:</strong> ${orderSummary.totalPrice.toFixed(2)}</p>
            </div>
            <div className="status-modal-actions two-cols">
              <button type="button" className="btn btn-outline-brand" onClick={() => setShowSummary(false)}>
                Edit Details
              </button>
              <button
                type="button"
                className="btn btn-brand"
                onClick={() => navigate("/checkout", { state: { order: orderSummary } })}
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showLoginModal ? (
        <div className="order-modal-backdrop" role="dialog" aria-modal="true">
          <div className="order-modal-card status-modal-card">
            <h3 className="mb-2">Login Required</h3>
            <p className="order-modal-sub mb-3">Please sign in to your account before placing an order.</p>
            <div className="status-modal-actions two-cols">
              <button
                type="button"
                className="btn btn-brand"
                onClick={() => navigate("/sign-in?redirect=/menu")}
              >
                Login
              </button>
              <button type="button" className="btn btn-outline-brand" onClick={() => setShowLoginModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default MenuSection;
