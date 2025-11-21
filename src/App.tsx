import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ConsultantPortal } from './components/consultant/ConsultantPortal';
import { Loader } from 'lucide-react';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <ConsultantPortal />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
