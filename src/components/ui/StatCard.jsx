import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatCard.css';

export default function StatCard({ title, value, change, icon: Icon, iconColor, onClick }) {
  const isPositive = change && change.startsWith('+');
  const isNegative = change && change.startsWith('-');

  return (
    <div className={`stat-card ${onClick ? 'stat-card--clickable' : ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
      <div className="stat-card__header">
        <span className="stat-card__title">{title}</span>
        {Icon && (
          <div className="stat-card__icon" style={iconColor ? { color: iconColor, background: `${iconColor}18` } : {}}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-card__value">{value}</div>
      {change && (
        <div className={`stat-card__change ${isPositive ? 'stat-card__change--positive' : ''} ${isNegative ? 'stat-card__change--negative' : ''}`}>
          {isPositive ? <TrendingUp size={14} /> : isNegative ? <TrendingDown size={14} /> : null}
          <span>{change} from last month</span>
        </div>
      )}
    </div>
  );
}
