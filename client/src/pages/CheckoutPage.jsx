import { useEffect, useMemo, useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, LoaderCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiRequest } from "../apiClient";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
const STORAGE_KEY = "vrbites_pending_checkout";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function estimateDeliveryTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 35);
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function SecureCheckoutForm({ initialOrder }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);
  const [isPreparingIntent, setPreparingIntent] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [initError, setInitError] = useState("");
  const [intentState, setIntentState] = useState({ clientSecret: "", paymentIntentId: "", orderDraft: null });
  const [successOrder, setSuccessOrder] = useState(null);
  const [showPaymentFailed, setShowPaymentFailed] = useState(false);

  useEffect(() => {
    const createIntent = async () => {
      setPreparingIntent(true);
      setErrorMessage("");

      try {
        const response = await apiRequest("/api/payments/create-intent", {
          method: "POST",
          body: JSON.stringify(initialOrder),
        });

        setIntentState(response);
      } catch (error) {
        // Never show backend validation text near Stripe card input
        const rawInitMsg = error.message || "Payment setup failed.";
        const friendly = "Please complete all order details to proceed with payment.";
        setInitError(friendly);
        console.warn("[Checkout] create-intent:", rawInitMsg);
      } finally {
        setPreparingIntent(false);
      }
    };

    createIntent();
  }, [initialOrder]);

  const onPay = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !intentState.clientSecret || isLoading) {
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setInitError("");
    setShowPaymentFailed(false);

    try {
      const card = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(intentState.clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: initialOrder.customerName,
            email: initialOrder.userEmail,
            phone: initialOrder.phone,
            address: {
              line1: initialOrder.deliveryAddress,
            },
          },
        },
      });

      if (result.error) {
        const rawMsg = result.error.message || "Payment could not be completed.";
        // Only show Stripe card errors; don't expose internal validation messages
        const isCardError = result.error.type === "card_error" || result.error.type === "validation_error";
        const errorMsg = isCardError ? rawMsg : "Please enter valid payment details.";
        setErrorMessage(errorMsg);
        setShowPaymentFailed(true);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      const paymentIntentId = result.paymentIntent?.id || intentState.paymentIntentId;
      const savedOrder = await apiRequest("/api/orders/complete-payment", {
        method: "POST",
        body: JSON.stringify({
          ...intentState.orderDraft,
          paymentIntentId,
        }),
      });

      sessionStorage.removeItem(STORAGE_KEY);
      setSuccessOrder(savedOrder);
      toast.success("Payment completed successfully!");
      // Show email delivery status if available
      if (savedOrder && savedOrder.emailStatus) {
        if (savedOrder.emailStatus === "success") {
          toast.success("Order email sent successfully.");
        } else if (savedOrder.emailStatus === "error") {
          toast.error("Order email delivery failed. Please check your inbox or spam folder.");
        }
      }
      setLoading(false);
    } catch (error) {
      const rawMsg = error.message || "Payment could not be completed.";
      // Show professional message for backend validation errors (phone, address, etc)
      const isStripeError = rawMsg.toLowerCase().includes("card") || rawMsg.toLowerCase().includes("stripe");
      const errorMsg = isStripeError ? rawMsg : "Please fill all required details correctly.";
      setErrorMessage(errorMsg);
      setShowPaymentFailed(true);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const totalPrice = useMemo(() => Number(initialOrder.totalPrice || 0), [initialOrder.totalPrice]);

  return (
    <main className="page-shell checkout-page">
      <section className="container py-5">
        <div className="checkout-grid">
          <article className="checkout-card summary-card">
            <h2>Order Summary</h2>
            <div className="checkout-line"><span>Food</span><strong>{initialOrder.foodName}</strong></div>
            <div className="checkout-line"><span>Quantity</span><strong>{initialOrder.quantity}</strong></div>
            <div className="checkout-line"><span>Price</span><strong>{formatCurrency(initialOrder.price)}</strong></div>
            <div className="checkout-line"><span>Delivery Address</span><strong>{initialOrder.deliveryAddress}</strong></div>
            <div className="checkout-total"><span>Total</span><strong>{formatCurrency(totalPrice)}</strong></div>
          </article>

          <article className="checkout-card payment-card">
            <div className="payment-head">
              <h2>Secure Payment</h2>
              <p><ShieldCheck size={18} /> Stripe encrypted checkout</p>
            </div>

            {isPreparingIntent ? (
              <div className="checkout-loading"><LoaderCircle size={20} className="spin" /> Initializing payment...</div>
            ) : (
              <>
                {initError ? <p className="checkout-error" style={{marginBottom: "12px"}}>{initError}</p> : null}
                <form onSubmit={onPay} className="checkout-form">
                  <label className="checkout-label" htmlFor="card-element">Credit or debit card</label>
                  <div className="card-input-wrap" id="card-element">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: "16px",
                            color: "#3c2f24",
                            "::placeholder": {
                              color: "#998778",
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  {errorMessage ? <p className="checkout-error">{errorMessage}</p> : null}

                  <button type="submit" className="btn btn-brand checkout-pay-btn" disabled={!stripe || isLoading || isPreparingIntent || Boolean(initError)}>
                    {isLoading ? <><LoaderCircle size={16} className="spin" /> Processing...</> : "Pay Securely"}
                  </button>
                </form>
              </>
            )}
          </article>
        </div>
      </section>

      {showPaymentFailed ? (
        <div className="order-modal-backdrop" role="dialog" aria-modal="true">
          <div className="order-modal-card status-modal-card">
            <h3 className="mb-2">Payment Failed</h3>
            <p className="order-modal-sub mb-3">Your payment could not be completed. Please try again.</p>
            <div className="status-modal-actions">
              <button type="button" className="btn btn-outline-brand" onClick={() => setShowPaymentFailed(false)}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {successOrder ? (
        <div className="order-modal-backdrop" role="dialog" aria-modal="true">
          <div className="order-modal-card status-modal-card">
            <h3 className="mb-2">Order Successful</h3>
            <p className="order-modal-sub mb-3">
              Your payment was successful and your order has been received.
            </p>
            <div className="status-modal-block">
              <p><strong>Order ID:</strong> {successOrder.orderId}</p>
              <p><strong>Estimated Delivery:</strong> {estimateDeliveryTime()}</p>
            </div>
            <div className="status-modal-actions two-cols">
              <button type="button" className="btn btn-outline-brand" onClick={() => navigate("/")}>Go to Home</button>
              <button type="button" className="btn btn-brand" onClick={() => navigate("/user-dashboard?tab=orders")}>My Orders</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const order = useMemo(() => {
    const fromState = location.state?.order;
    if (fromState) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromState));
      return fromState;
    }

    try {
      const fromStorage = sessionStorage.getItem(STORAGE_KEY);
      return fromStorage ? JSON.parse(fromStorage) : null;
    } catch {
      return null;
    }
  }, [location.state]);

  useEffect(() => {
    if (!order) {
      navigate("/menu", { replace: true });
    }
  }, [navigate, order]);

  if (!order) {
    return null;
  }

  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    return (
      <main className="page-shell">
        <section className="container py-5">
          <article className="checkout-card">
            <h2>Missing Stripe Key</h2>
            <p>Add <code>VITE_STRIPE_PUBLIC_KEY</code> in <code>client/.env</code> and restart the client server.</p>
          </article>
        </section>
      </main>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <SecureCheckoutForm initialOrder={order} />
    </Elements>
  );
}

export default CheckoutPage;
