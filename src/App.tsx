import { useState, useEffect } from 'react';
import Layout, { Page } from './components/Layout';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Departments from './pages/Departments';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import Pharmacy from './pages/Pharmacy';
import Labs from './pages/Labs';
import Billing from './pages/Billing';
import Login from './pages/Login';
import Signup from './pages/Signup';

function AppContent() {
  const { hospitalUser, loading, continueAsGuest } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading MediCore HMS...</p>
        </div>
      </div>
    );
  }

  // Show auth pages if not logged in
  if (!hospitalUser) {
    if (authPage === 'login') {
      return <Login onSwitchToSignup={() => setAuthPage('signup')} onSkipLogin={continueAsGuest} />;
    }
    return <Signup onSwitchToLogin={() => setAuthPage('login')} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'patients': return <Patients />;
      case 'doctors': return <Doctors />;
      case 'departments': return <Departments />;
      case 'appointments': return <Appointments />;
      case 'medical-records': return <MedicalRecords />;
      case 'pharmacy': return <Pharmacy />;
      case 'labs': return <Labs />;
      case 'billing': return <Billing />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
