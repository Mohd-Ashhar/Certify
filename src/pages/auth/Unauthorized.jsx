import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/FormElements';
import { getDisplayRoleLabel } from '../../utils/roles';
import './Unauthorized.css';

export default function Unauthorized() {
  const { user, getRoleDashboard } = useAuth();
  const { t } = useTranslation();

  const backPath = user ? getRoleDashboard(user.role) : '/login';

  return (
    <div className="unauthorized">
      <div className="unauthorized__card">
        <div className="unauthorized__icon">
          <ShieldX size={48} />
        </div>
        <h1 className="unauthorized__title">{t('unauthorized.accessDenied')}</h1>
        <p className="unauthorized__text">{t('unauthorized.noPermission')}</p>
        {user && (
          <p className="unauthorized__role">
            {t('unauthorized.yourRole')} <strong>{getDisplayRoleLabel(user.role, user.stakeholder_type) || user.role}</strong>
          </p>
        )}
        <div className="unauthorized__actions">
          <Link to={backPath}>
            <Button variant="primary" size="md">
              <ArrowLeft size={16} /> {t('common.back')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
