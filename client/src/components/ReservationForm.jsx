import { useEffect, useMemo, useState } from "react";
import { addMinutes, format, isToday, isBefore } from "date-fns";
import { useUser } from "@clerk/clerk-react";
import {
  FaUser,
  FaPhoneAlt,
  FaUsers,
  FaCalendarAlt,
  FaClock,
  FaRegCommentDots,
  FaCreditCard,
} from "react-icons/fa";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ShieldCheck, LoaderCircle } from "lucide-react";
import { apiRequest } from "../apiClient";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Pricing: $25 deposit per guest (refundable at the restaurant)
const DEPOSIT_PER_GUEST = 25;

// Statuses that mean a table is actively blocked
const BLOCKING_STATUSES = new Set([
  "pending",
  "confirmed",
  "in progress",
  "reserved",
]);

function formatUSD(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

const initialFormData = {
  fullName: "",
  email: "",
  phone: "",
  guests: "",
  date: "",
  time: "",
  tableNumber: "",
  specialRequest: "",
};

// Step 1: details form
function ReservationDetailsForm({
  formData,
  errors,
  handleChange,
  onNext,
  isValidating,
  minDate,
  availableTables,
  timeSlots,
  onDateChange,
  onTimeChange,
  loadingTables,
  conflictWarning,
}) {
  const guestCount = Number(formData.guests) || 0;
  const depositAmount = guestCount * DEPOSIT_PER_GUEST;

  return (
    <div className="reservation-card card border-0 mx-auto">
      <div className="card-body reservation-card-body">
        <h3 className="reservation-title mb-2">Book a Table</h3>
        <p className="reservation-intro mb-4">
          Complete the form and reserve your dining experience with us.
        </p>

        {/* Pricing notice */}
        <div className="res-pricing-notice mb-4">
          <div className="res-pricing-row">
            <span className="res-pricing-label">Reservation deposit</span>
            <span className="res-pricing-rate">{formatUSD(DEPOSIT_PER_GUEST)} / guest</span>
          </div>
          {guestCount > 0 && (
            <div className="res-pricing-total-row">
              <span>{guestCount} guest{guestCount > 1 ? "s" : ""} × {formatUSD(DEPOSIT_PER_GUEST)}</span>
              <strong className="res-pricing-total">{formatUSD(depositAmount)}</strong>
            </div>
          )}
          <p className="res-pricing-note">
            Deposit is credited toward your bill. Fully refundable if cancelled 24h before.
          </p>
          <p className="res-cancellation-note">
            To cancel a reservation, please send a cancellation request to the restaurant owner (VR BITES).
          </p>
        </div>

        <form onSubmit={onNext} noValidate>
          <div className="row g-3">
            {/* Full Name */}
            <div className="col-md-6">
              <label htmlFor="fullName" className="form-label">Full Name</label>
              <div className="input-group reservation-input-group">
                <span className="input-group-text"><FaUser /></span>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  className="form-control"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              {errors.fullName ? <p className="reservation-error mb-0">{errors.fullName}</p> : null}
            </div>

            {/* Phone */}
            <div className="col-md-6">
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <div className="input-group reservation-input-group">
                <span className="input-group-text"><FaPhoneAlt /></span>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10 digit number"
                  maxLength={10}
                  required
                />
              </div>
              {errors.phone ? <p className="reservation-error mb-0">{errors.phone}</p> : null}
            </div>

            {/* Guests */}
            <div className="col-md-6">
              <label htmlFor="guests" className="form-label">Number of Guests</label>
              <div className="input-group reservation-input-group">
                <span className="input-group-text"><FaUsers /></span>
                <input
                  id="guests"
                  type="number"
                  name="guests"
                  className="form-control"
                  value={formData.guests}
                  onChange={handleChange}
                  placeholder="How many guests?"
                  min="1"
                  max="20"
                  required
                />
              </div>
              {errors.guests ? <p className="reservation-error mb-0">{errors.guests}</p> : null}
            </div>

            {/* Reservation Date — native input, visually matches all other fields */}
            <div className="col-md-6">
              <label htmlFor="date" className="form-label">Reservation Date</label>
              <div className="input-group reservation-input-group">
                <span className="input-group-text"><FaCalendarAlt /></span>
                <input
                  id="date"
                  type="date"
                  name="date"
                  className="form-control res-date-input"
                  value={formData.date}
                  min={minDate}
                  onChange={onDateChange}
                  required
                />
              </div>
              {errors.date ? <p className="reservation-error mb-0">{errors.date}</p> : null}
            </div>

            {/* Reservation Time */}
            <div className="col-md-6">
              <label htmlFor="time" className="form-label">Reservation Time</label>
              <div className="input-group reservation-input-group">
                <span className="input-group-text"><FaClock /></span>
                <select
                  id="time"
                  name="time"
                  className="form-control"
                  value={formData.time}
                  onChange={onTimeChange}
                  required
                >
                  <option value="">Select time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value} disabled={slot.disabled}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.time ? <p className="reservation-error mb-0">{errors.time}</p> : null}
            </div>

            {/* Table Number */}
            <div className="col-md-6">
              <label htmlFor="tableNumber" className="form-label">Table Number</label>
              <div className="input-group reservation-input-group">
                <span className="input-group-text">#</span>
                <select
                  id="tableNumber"
                  name="tableNumber"
                  className="form-control"
                  value={formData.tableNumber}
                  onChange={handleChange}
                  required
                  disabled={loadingTables}
                >
                  <option value="">
                    {loadingTables
                      ? "Loading tables..."
                      : !formData.date || !formData.time
                      ? "Select date & time first"
                      : availableTables.length === 0
                      ? "No tables available"
                      : "Select table"}
                  </option>
                  {availableTables.map((table) => (
                    <option key={table} value={table}>Table {table}</option>
                  ))}
                </select>
              </div>
              {errors.tableNumber ? <p className="reservation-error mb-0">{errors.tableNumber}</p> : null}
              {availableTables.length === 0 && !loadingTables && formData.date && formData.time && (
                <div className="reservation-error mt-1">No tables available for this slot.</div>
              )}
              {/* Conflict warning shown inline under table selector */}
              {conflictWarning && (
                <div className="res-conflict-warning mt-2">
                  ⚠ {conflictWarning}
                </div>
              )}
            </div>

            {/* Special Request */}
            <div className="col-12">
              <label htmlFor="specialRequest" className="form-label">Special Request (optional)</label>
              <div className="input-group reservation-input-group">
                <span className="input-group-text align-items-start pt-3"><FaRegCommentDots /></span>
                <textarea
                  id="specialRequest"
                  name="specialRequest"
                  className="form-control"
                  value={formData.specialRequest}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Add any preferences or special notes"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-brand reservation-submit w-100 mt-4"
            disabled={isValidating || Boolean(conflictWarning)}
          >
            {isValidating ? "Checking availability..." : (
              <>
                <FaCreditCard style={{ marginRight: 8 }} />
                Continue to Payment {guestCount > 0 ? `— ${formatUSD(depositAmount)}` : ""}
              </>
            )}
          </button>
          {errors.submit ? <p className="reservation-error mb-0 mt-2">{errors.submit}</p> : null}
        </form>
      </div>
    </div>
  );
}

// Step 2: payment form
function ReservationPaymentForm({ formData, intentState, userEmail, onBack, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const guestCount = Number(formData.guests) || 1;
  const depositAmount = guestCount * DEPOSIT_PER_GUEST;

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !intentState.clientSecret || isLoading) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const card = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(intentState.clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: formData.fullName,
            email: userEmail,
            phone: formData.phone,
          },
        },
      });
      if (result.error) {
        setErrorMessage(result.error.message || "Payment could not be completed.");
        toast.error(result.error.message || "Payment failed.");
        setLoading(false);
        return;
      }
      const paymentIntentId = result.paymentIntent?.id || intentState.paymentIntentId;
      // Save reservation with payment confirmation
      const saved = await apiRequest("/api/reservations", {
        method: "POST",
        body: JSON.stringify({
          customerName: formData.fullName.trim(),
          email: userEmail.trim().toLowerCase(),
          phone: formData.phone.trim(),
          guests: guestCount,
          date: formData.date,
          time: formData.time,
          tableNumber: formData.tableNumber,
          specialRequest: formData.specialRequest.trim(),
          status: "Pending",
          reservationStatus: "Pending",
          depositAmount,
          depositPaid: true,
          paymentStatus: "Paid",
          paymentIntentId,
          bookedAt: new Date().toISOString(),
        }),
      });
      toast.success("Reservation submitted! Payment of " + formatUSD(depositAmount) + " received.");
      onSuccess(saved);
    } catch (err) {
      const msg = err.message || "Payment could not be completed.";
      setErrorMessage(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="reservation-card card border-0 mx-auto">
      <div className="card-body reservation-card-body">
        <button type="button" className="res-back-btn mb-3" onClick={onBack}>
          ← Back to details
        </button>
        <h3 className="reservation-title mb-1">Secure Payment</h3>
        <p className="reservation-intro mb-4">
          <ShieldCheck size={15} style={{ marginRight: 5, verticalAlign: "middle" }} />
          Stripe encrypted · 256-bit SSL
        </p>

        {/* Booking summary */}
        <div className="res-payment-summary mb-4">
          <h6 className="res-payment-summary-title">Booking Summary</h6>
          <div className="res-sum-row"><span>Name</span><strong>{formData.fullName}</strong></div>
          <div className="res-sum-row"><span>Table</span><strong>Table {formData.tableNumber}</strong></div>
          <div className="res-sum-row"><span>Date</span><strong>{formData.date}</strong></div>
          <div className="res-sum-row"><span>Time</span><strong>{formData.time}</strong></div>
          <div className="res-sum-row"><span>Guests</span><strong>{guestCount} person{guestCount > 1 ? "s" : ""}</strong></div>
          <div className="res-sum-row res-sum-total">
            <span>Deposit ({guestCount} × {formatUSD(DEPOSIT_PER_GUEST)})</span>
            <strong>{formatUSD(depositAmount)}</strong>
          </div>
        </div>

        <form onSubmit={handlePay}>
          <label className="checkout-label" htmlFor="res-card-element">Credit or debit card</label>
          <div className="card-input-wrap mb-3" id="res-card-element">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#3c2f24",
                    "::placeholder": { color: "#998778" },
                  },
                },
              }}
            />
          </div>

          {errorMessage ? <p className="checkout-error mb-3">{errorMessage}</p> : null}

          <button
            type="submit"
            className="btn btn-brand reservation-submit w-100"
            disabled={!stripe || isLoading || !intentState.clientSecret}
          >
            {isLoading
              ? <><LoaderCircle size={16} className="spin" style={{ marginRight: 8 }} />Processing...</>
              : `Pay ${formatUSD(depositAmount)} & Request Table`}
          </button>
          <p className="res-deposit-note mt-2">
            Deposit credited to your bill on arrival. Cancel 24h before for a full refund.
          </p>
        </form>
      </div>
    </div>
  );
}

// Main wrapper — handles the two-step flow
function ReservationFormInner() {
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const navigate = useNavigate();

  const [step, setStep] = useState("details"); // "details" | "payment" | "done"
  const [formData, setFormData] = useState(() => ({
    ...initialFormData,
    email: userEmail ? userEmail.toLowerCase() : "",
    _lockedEmail: Boolean(userEmail),
  }));
  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [intentState, setIntentState] = useState({ clientSecret: "", paymentIntentId: "" });
  const [savedReservation, setSavedReservation] = useState(null);

  // Restaurant open/close times
  const OPEN_HOUR = 10;
  const CLOSE_HOUR = 23;
  const SLOT_INTERVAL = 30; // minutes

  // Available tables fetched from API (already filters out booked ones)
  const [availableTables, setAvailableTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Inline conflict warning for the currently-selected table
  const [conflictWarning, setConflictWarning] = useState("");

  // Generate time slots for the selected date
  const timeSlots = useMemo(() => {
    const slots = [];
    const today = new Date();
    const baseDate = formData.date ? new Date(formData.date) : new Date(today);
    baseDate.setHours(OPEN_HOUR, 0, 0, 0);
    const closeDate = new Date(baseDate);
    closeDate.setHours(CLOSE_HOUR, 0, 0, 0);
    for (let d = new Date(baseDate); d < closeDate; d = addMinutes(d, SLOT_INTERVAL)) {
      let disabled = false;
      if (formData.date && isToday(new Date(formData.date))) {
        if (isBefore(d, today)) disabled = true;
      }
      slots.push({
        value: format(d, "HH:mm"),
        label: format(d, "hh:mm a"),
        disabled,
      });
    }
    return slots;
  }, [formData.date]);

  // Fetch available tables whenever date or time changes
  useEffect(() => {
    const fetchTables = async () => {
      if (!formData.date || !formData.time) {
        setAvailableTables([]);
        setConflictWarning("");
        return;
      }
      setLoadingTables(true);
      setConflictWarning("");
      try {
        const res = await apiRequest(
          `/api/reservations/available-tables?date=${formData.date}&time=${formData.time}`
        );
        const tables = res.tables || [];
        setAvailableTables(tables);

        // If the currently-selected table is no longer available, clear it and warn
        if (formData.tableNumber && !tables.includes(Number(formData.tableNumber)) && !tables.includes(String(formData.tableNumber))) {
          setFormData((prev) => ({ ...prev, tableNumber: "" }));
          setConflictWarning("Selected table is already reserved for this date and time. Please choose another table or select a different time slot.");
        }
      } catch {
        setAvailableTables([]);
      } finally {
        setLoadingTables(false);
      }
    };
    fetchTables();
  }, [formData.date, formData.time]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear conflict warning whenever user picks a new (valid) table
  useEffect(() => {
    if (!formData.tableNumber) return;
    const tableNum = formData.tableNumber;
    const isAvailable =
      availableTables.includes(Number(tableNum)) ||
      availableTables.includes(String(tableNum));
    if (isAvailable) {
      setConflictWarning("");
    } else if (availableTables.length > 0) {
      setConflictWarning(
        "Table already booked by another guest. Please select a different table, date, or time."
      );
    }
  }, [formData.tableNumber, availableTables]);

  const minDate = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    setFormData((prev) => ({ ...prev, email: userEmail.toLowerCase(), _lockedEmail: true }));
  }, [userEmail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Native date input onChange — replaces MUI DatePicker handler
  const handleDateChange = (e) => {
    const value = e.target.value; // "yyyy-MM-dd" string directly from native input
    setFormData((prev) => ({ ...prev, date: value, time: "", tableNumber: "" }));
    setConflictWarning("");
    if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
  };

  const handleTimeChange = (e) => {
    setFormData((prev) => ({ ...prev, time: e.target.value, tableNumber: "" }));
    setConflictWarning("");
    if (errors.time) setErrors((prev) => ({ ...prev, time: "" }));
  };

  const validate = () => {
    const { fullName, phone, guests, date, time, tableNumber } = formData;
    const errs = {};
    if (!fullName.trim()) errs.fullName = "Full Name is required.";
    if (!userEmail) errs.submit = "Please sign in before reserving a table.";
    if (!/^\d{10}$/.test(phone.trim())) errs.phone = "Please enter a valid phone number.";
    if (!guests || Number(guests) < 1) errs.guests = "Number of guests must be at least 1.";
    if (Number(guests) > 20) errs.guests = "Maximum 20 guests per reservation.";
    if (!date) {
      errs.date = "Reservation date is required.";
    } else {
      const sel = new Date(date); sel.setHours(0, 0, 0, 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (sel < today) errs.date = "Reservation date cannot be a past date.";
    }
    if (!time) errs.time = "Reservation time is required.";
    if (!tableNumber) errs.tableNumber = "Please select a table number.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async (e) => {
    e.preventDefault();

    // Bail early if there's an active conflict warning
    if (conflictWarning) {
      toast.error("Please resolve the table conflict before continuing.");
      return;
    }

    if (!validate()) return;

    setIsValidating(true);
    try {
      // Final server-side conflict check before creating payment intent
      const checkRes = await apiRequest(
        `/api/reservations/available-tables?date=${formData.date}&time=${formData.time}`
      );
      const currentlyAvailable = checkRes.tables || [];
      const tableNum = formData.tableNumber;
      const stillAvailable =
        currentlyAvailable.includes(Number(tableNum)) ||
        currentlyAvailable.includes(String(tableNum));

      if (!stillAvailable) {
        setConflictWarning(
          "Selected table is already reserved for this date and time. Please choose another table or select a different time slot."
        );
        setErrors((prev) => ({
          ...prev,
          tableNumber: "This table is no longer available. Please pick another.",
        }));
        setIsValidating(false);
        return;
      }

      const guestCount = Number(formData.guests);
      const depositAmount = guestCount * DEPOSIT_PER_GUEST;
      const response = await apiRequest("/api/reservations/create-intent", {
        method: "POST",
        body: JSON.stringify({
          customerName: formData.fullName.trim(),
          email: userEmail.trim().toLowerCase(),
          guests: guestCount,
          depositAmount,
        }),
      });
      setIntentState(response);
      setStep("payment");
    } catch (err) {
      toast.error(err.message || "Unable to initialize payment. Please try again.");
      setErrors((prev) => ({ ...prev, submit: err.message || "Unable to initialize payment." }));
    } finally {
      setIsValidating(false);
    }
  };

  const handleSuccess = (saved) => {
    setSavedReservation(saved);
    setStep("done");
  };

  if (step === "done") {
    return (
      <div className="reservation-card card border-0 mx-auto">
        <div className="card-body reservation-card-body text-center">
          <div className="res-success-icon mb-3">✓</div>
          <h3 className="reservation-title mb-2">Request Submitted!</h3>
          <p className="reservation-intro mb-1">
            Your reservation request has been submitted successfully and is awaiting confirmation from our team.
          </p>
          <p className="res-deposit-note mb-4">
            Payment of {formatUSD(Number(formData.guests) * DEPOSIT_PER_GUEST)} received.
            You will receive an email once our team reviews your request.
          </p>
          <div className="res-success-detail mb-4">
            <div className="res-sum-row res-sum-row-booking-id"><span>Booking ID</span><strong>{savedReservation?.reservationId || "—"}</strong></div>
            <div className="res-sum-row"><span>Table</span><strong>Table {formData.tableNumber}</strong></div>
            <div className="res-sum-row"><span>Date</span><strong>{formData.date}</strong></div>
            <div className="res-sum-row"><span>Time</span><strong>{formData.time}</strong></div>
            <div className="res-sum-row"><span>Guests</span><strong>{formData.guests}</strong></div>
            <div className="res-sum-row res-sum-total">
              <span>Deposit Paid</span>
              <strong>{formatUSD(Number(formData.guests) * DEPOSIT_PER_GUEST)}</strong>
            </div>
          </div>
          <div className="status-modal-actions two-cols">
            <button type="button" className="btn btn-brand" onClick={() => navigate("/")}>Go to Home</button>
            <button type="button" className="btn btn-outline-brand" onClick={() => navigate("/user-dashboard?tab=reservations")}>My Reservations</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <ReservationPaymentForm
        formData={formData}
        intentState={intentState}
        userEmail={userEmail}
        onBack={() => setStep("details")}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <ReservationDetailsForm
      formData={formData}
      errors={errors}
      handleChange={handleChange}
      onNext={handleNext}
      isValidating={isValidating}
      minDate={minDate}
      availableTables={availableTables}
      loadingTables={loadingTables}
      timeSlots={timeSlots}
      onDateChange={handleDateChange}
      onTimeChange={handleTimeChange}
      conflictWarning={conflictWarning}
    />
  );
}

function ReservationForm() {
  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    return (
      <div className="reservation-card card border-0 mx-auto">
        <div className="card-body reservation-card-body">
          <h3 className="reservation-title mb-2">Configuration Required</h3>
          <p className="reservation-intro">
            Add <code>VITE_STRIPE_PUBLIC_KEY</code> in <code>client/.env</code> and restart the dev server to enable reservation payments.
          </p>
        </div>
      </div>
    );
  }
  return (
    <Elements stripe={stripePromise}>
      <ReservationFormInner />
    </Elements>
  );
}

export default ReservationForm;
