import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/FormElements';
import { ROLE_LABELS } from '../../utils/roles';
import './Unauthorized.css';

export default function Unauthorized() {
  const { user, getRoleDashboard } = useAuth();
  
  const backPath = user ? getRoleDashboard(user.role) : '/login';

  return (
    <div className="unauthorized">
      <div className="unauthorized__card">
        <div className="unauthorized__icon">
          <ShieldX size={48} />
        </div>
        <h1 className="unauthorized__title">Access Denied</h1>
        <p className="unauthorized__text">
          You don't have permission to access this page.
        </p>
        {user && (
          <p className="unauthorized__role">
            Your role: <strong>{ROLE_LABELS[user.role] || user.role}</strong>
          </p>
        )}
        <div className="unauthorized__actions">
          <Link to={backPath}>
            <Button variant="primary" size="md">
              <ArrowLeft size={16} /> Back
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
