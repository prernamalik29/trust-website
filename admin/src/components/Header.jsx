import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Header.css';

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err) {
      alert('Failed to log out');
    }
  }

  return (
    <header className="admin-header">
      <button className="menu-toggle" onClick={onMenuToggle}>
        <i className="fas fa-bars"></i>
      </button>
      <div className="header-right">
        <span className="header-email">
          <i className="fas fa-user-circle"></i>
          {user?.email}
        </span>
        <button className="btn btn-outline btn-sm" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </div>
    </header>
  );
}
