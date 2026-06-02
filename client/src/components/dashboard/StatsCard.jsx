function StatsCard({ icon, value, label, tone = "default" }) {
  return (
    <article className={`db-card db-stat-card ${tone}`}>
      <div className="db-stat-icon" aria-hidden="true">
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: "1 1 0" }}>
        <h3 className="db-stat-value" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</h3>
        <p className="db-stat-label">{label}</p>
      </div>
    </article>
  );
}

export default StatsCard;
