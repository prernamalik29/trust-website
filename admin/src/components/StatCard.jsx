import './StatCard.css';

export default function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card" style={{ borderTopColor: color || 'var(--admin-secondary)' }}>
      <div className="stat-card-icon" style={{ color: color || 'var(--admin-secondary)' }}>
        <i className={icon}></i>
      </div>
      <div className="stat-card-info">
        <h3>{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}
