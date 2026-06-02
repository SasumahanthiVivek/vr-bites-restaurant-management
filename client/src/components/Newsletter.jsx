import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { CheckCircle2 } from "lucide-react";
import { isAdminEmail } from "../auth/authLogic";
import { apiRequest } from "../apiClient";
import { toast } from "react-hot-toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function Newsletter() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const signedInEmail = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() || "";
  const isAdmin = useMemo(() => isAdminEmail(signedInEmail), [signedInEmail]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !signedInEmail || isAdmin) {
      return;
    }

    setEmail(signedInEmail);

    const checkStatus = async () => {
      try {
        const status = await apiRequest(`/api/newsletter/status/${encodeURIComponent(signedInEmail)}`);
        if (status?.subscribed) {
          setIsSubscribed(true);
          setMessage("You are already subscribed to VR BITES updates.");
        }
      } catch {
        // Fail silently so homepage remains usable.
      }
    };

    checkStatus();
  }, [isAdmin, isSignedIn, signedInEmail]);

  function validateEmail(value) {
    if (!value.trim()) {
      return "Please enter a valid email address";
    }

    if (!EMAIL_REGEX.test(value)) {
      return "Please enter a valid email address";
    }

    return "";
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
    if (error) {
      setError(false);
    }

    if (message) {
      setMessage("");
    }

    if (isSubscribed) {
      setIsSubscribed(false);
    }
  }

  async function handleEmailBlur() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail) || isAdmin) {
      return;
    }

    try {
      const status = await apiRequest(`/api/newsletter/status/${encodeURIComponent(normalizedEmail)}`);
      if (status?.subscribed) {
        setIsSubscribed(true);
        setMessage("You are already subscribed to VR BITES updates.");
      }
    } catch {
      // Ignore pre-check errors and allow submit path to handle API errors.
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting || isSubscribed) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const validationError = validateEmail(normalizedEmail);
    if (validationError) {
      setError(true);
      setMessage(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(false);
      setMessage("");

      const response = await apiRequest("/api/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          customerName: user?.fullName || user?.username || "Customer",
        }),
      });

      if (response?.alreadySubscribed) {
        setMessage("You are already subscribed to VR BITES updates.");
        toast("You are already subscribed.", { icon: "ℹ️" });
      } else {
        setMessage("Thank you for subscribing to our newsletter!");
        toast.success("Thank you for subscribing to our newsletter!");
        // Show email delivery status if available
        if (response && response.emailStatus) {
          if (response.emailStatus === "success") {
            toast.success("Newsletter email sent successfully.");
          } else if (response.emailStatus === "error") {
            toast.error("Newsletter email delivery failed. Please check your inbox or spam folder.");
          }
        }
      }

      setIsSubscribed(true);
      setEmail(isSignedIn && signedInEmail ? signedInEmail : normalizedEmail);
    } catch (apiError) {
      const errorMessage = apiError?.message || "Subscription failed. Please try again.";
      setError(true);
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAdmin) {
    return null;
  }

  return (
    <section id="newsletter" className="newsletter-subscribe-section pt-0">
      <div className="container">
        <div className="newsletter-subscribe">
          <div className="newsletter-copy">
            <p className="newsletter-kicker mb-2">STAY UPDATED</p>
            <h2 className="newsletter-title mb-2">Subscribe Newsletter</h2>
            <p className="newsletter-description mb-0">
              Get latest offers, seasonal menu updates, and exclusive dining deals.
            </p>
          </div>
          {isSubscribed ? (
            <div className="newsletter-subscribed-panel" role="status">
              <CheckCircle2 size={22} />
              <div>
                <strong>You are already subscribed to VR BITES updates.</strong>
                <span>Premium menu drops, dining events, and exclusive offers will arrive in your inbox.</span>
              </div>
              <button type="button" className="btn btn-brand newsletter-btn is-disabled" disabled>
                Subscribed
              </button>
            </div>
          ) : (
          <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
            <label className="visually-hidden" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              disabled={(isSignedIn && Boolean(signedInEmail)) || isSubscribed}
              aria-invalid={Boolean(error)}
              aria-describedby="newsletter-feedback"
            />
            <button
              type="submit"
              className="btn btn-brand newsletter-btn"
              disabled={isSubmitting || isSubscribed}
            >
              {isSubmitting ? "Subscribing..." : isSubscribed ? "Subscribed ✓" : "Subscribe"}
            </button>

            <p
              id="newsletter-feedback"
              className={`newsletter-message ${error ? "is-error" : "is-success"}`}
              aria-live="polite"
            >
              {error || message}
            </p>
          </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default Newsletter;
