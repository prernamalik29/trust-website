import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Causes from './pages/Causes';
import Events from './pages/Events';
import Testimonials from './pages/Testimonials';
import Blog from './pages/Blog';
import Contacts from './pages/Contacts';
import Volunteers from './pages/Volunteers';
import Donations from './pages/Donations';
import Newsletter from './pages/Newsletter';
import EventRegistrations from './pages/EventRegistrations';
import EventGallery from './pages/EventGallery';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<Login />} />
          {/* Public-facing gallery — no auth required */}
          <Route path="/admin/gallery" element={<EventGallery />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="causes" element={<Causes />} />
            <Route path="events" element={<Events />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="blog" element={<Blog />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="volunteers" element={<Volunteers />} />
            <Route path="donations" element={<Donations />} />
            <Route path="newsletter" element={<Newsletter />} />
            <Route path="event-registrations" element={<EventRegistrations />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
