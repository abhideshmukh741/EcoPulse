export default function StatCard({
  icon,
  title,
  value,
  unit,
  trend
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className="stat-icon">
          {icon}
        </div>

        <span className="trend">
          {trend}
        </span>
      </div>

      <p>{title}</p>

      <h3>
        {value}
        <span>{unit}</span>
      </h3>
    </div>
  );
}