function TestimonialCard({ testimonial }) {
  return (
    <article className="testimonial-review-card">
      <div className="testimonial-card-top">
        <img
          src={testimonial.image}
          alt={`${testimonial.name} profile`}
          className="testimonial-avatar feedback-avatar"
        />
        <div>
          <h3 className="testimonial-name mb-1">{testimonial.name}</h3>
          <p className="testimonial-role mb-0">{testimonial.role}</p>
        </div>
      </div>

      <p className="customer-quote mb-0">"{testimonial.review}"</p>

      <div className="testimonial-badges">
        {testimonial.badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <span key={badge.label} className="feedback-badge">
              <Icon aria-hidden="true" /> {badge.label}
            </span>
          );
        })}
      </div>
    </article>
  );
}

export default TestimonialCard;
