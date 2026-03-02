import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navSections = [
  {
    heading: 'Content',
    items: [
      { path: '/admin', icon: 'fas fa-tachometer-alt', label: 'Dashboard', end: true },
      { path: '/admin/causes', icon: 'fas fa-hand-holding-heart', label: 'Causes' },
      { path: '/admin/events', icon: 'fas fa-calendar-alt', label: 'Events' },
      { path: '/admin/testimonials', icon: 'fas fa-quote-right', label: 'Testimonials' },
      { path: '/admin/blog', icon: 'fas fa-blog', label: 'Blog' },
    ],
  },
  {
    heading: 'Submissions',
    items: [
      { path: '/admin/contacts', icon: 'fas fa-envelope', label: 'Contacts / Messages' },
      { path: '/admin/volunteers', icon: 'fas fa-hands-helping', label: 'Volunteers' },
      { path: '/admin/event-registrations', icon: 'fas fa-calendar-check', label: 'Event Registrations' },
      { path: '/admin/donations', icon: 'fas fa-donate', label: 'Donations' },
      { path: '/admin/newsletter', icon: 'fas fa-paper-plane', label: 'Newsletter' },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <h2>OAIT</h2>
          <span>Admin Panel</span>
        </div>
        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.heading} className="sidebar-section">
              <span className="sidebar-section-heading">{section.heading}</span>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <a href="/" target="_blank" rel="noopener noreferrer" className="nav-link">
            <i className="fas fa-external-link-alt"></i>
            <span>View Site</span>
          </a>
        </div>
      </aside>
    </>
  );
}
