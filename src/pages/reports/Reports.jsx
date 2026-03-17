import { BarChart3, FileText, TrendingUp, Calendar, Clock, ArrowRight } from 'lucide-react';
import './Reports.css';

const reportCategories = [
  {
    title: 'Certification Analytics',
    description: 'Track certification trends and success rates across regions',
    icon: TrendingUp,
    color: '#3ECF8E',
    available: false,
  },
  {
    title: 'Audit Reports',
    description: 'Detailed reports from completed and ongoing audits',
    icon: FileText,
    color: '#60A5FA',
    available: false,
  },
  {
    title: 'Regional Performance',
    description: 'Compare certification activity and compliance by region',
    icon: BarChart3,
    color: '#A78BFA',
    available: false,
  },
  {
    title: 'Monthly Summaries',
    description: 'Automated monthly reports on platform activity',
    icon: Calendar,
    color: '#FBBF24',
    available: false,
  },
  {
    title: 'Compliance Timeline',
    description: 'Track compliance deadlines and renewal timelines',
    icon: Clock,
    color: '#F87171',
    available: false,
  },
];

export default function Reports() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Analytics and reporting tools</p>
        </div>
      </div>

      <div className="reports__coming-soon">
        <div className="reports__coming-soon-badge">Coming Soon</div>
        <h2 className="reports__coming-soon-title">Advanced Reporting</h2>
        <p className="reports__coming-soon-text">
          Powerful analytics and reporting tools are being built to help you track 
          certification progress, audit outcomes, and regional performance.
        </p>
      </div>

      <div className="reports__grid">
        {reportCategories.map((cat, idx) => (
          <div key={idx} className="reports__card">
            <div className="reports__card-icon" style={{ color: cat.color, background: `${cat.color}18` }}>
              <cat.icon size={24} />
            </div>
            <h3 className="reports__card-title">{cat.title}</h3>
            <p className="reports__card-desc">{cat.description}</p>
            <div className="reports__card-footer">
              <span className="reports__card-status">In Development</span>
              <ArrowRight size={16} className="reports__card-arrow" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
