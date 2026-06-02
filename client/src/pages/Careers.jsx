const openPositions = [
  {
    role: "Chef",
    summary: "Lead station operations, menu consistency, and quality control during lunch and dinner service.",
  },
  {
    role: "Kitchen Assistant",
    summary: "Support prep, hygiene workflows, and kitchen readiness while maintaining ingredient standards.",
  },
  {
    role: "Restaurant Manager",
    summary: "Oversee front-of-house operations, guest satisfaction, team scheduling, and daily service performance.",
  },
  {
    role: "Wait Staff",
    summary: "Deliver attentive table service, guide menu recommendations, and create a welcoming dining experience.",
  },
];

function Careers() {
  return (
    <main className="page-shell">
      <section className="about-page-section owner-intro-section">
        <div className="container">
          <div className="text-center mb-5">
            <h1 className="section-title mb-2">Careers at VR BITES</h1>
            <p className="section-sub mx-auto">
              Build your hospitality career in a team that values craftsmanship, respect, and growth.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-lg-6">
              <article className="about-value-card h-100">
                <h2 className="h4 mb-3">Why Work With Us</h2>
                <p className="mb-0">
                  At VR BITES, we invest in people first. Team members receive practical training, supportive
                  leadership, and opportunities to grow across kitchen and service operations.
                </p>
              </article>
            </div>
            <div className="col-lg-6">
              <article className="about-value-card h-100">
                <h2 className="h4 mb-3">Application Instructions</h2>
                <p className="mb-2">Send your resume and a short cover note to:</p>
                <p className="mb-2">
                  <a href="mailto:vrbitesrestaurant@gmail.com">vrbitesrestaurant@gmail.com</a>
                </p>
                <p className="mb-0">Please mention your preferred role, shift availability, and relevant experience.</p>
              </article>
            </div>
          </div>

          <section className="mt-5">
            <h2 className="section-title mb-3">Open Positions</h2>
            <div className="row g-3">
              {openPositions.map((position) => (
                <div key={position.role} className="col-md-6">
                  <article className="about-value-card h-100">
                    <h3 className="h5 mb-2">{position.role}</h3>
                    <p className="mb-0">{position.summary}</p>
                  </article>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default Careers;
