import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './components/public/LandingPage';
import { PublicPortal } from './components/public/PublicPortal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminPortal } from './components/admin/AdminPortal';

const AppContent: React.FC = () => {
  const { currentPortal, setCurrentPortal, adminLoggedIn } = useApp();
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // If user requests to open Admin from Landing or Public
  const handleOpenAdmin = () => {
    if (adminLoggedIn) {
      setCurrentPortal('admin');
      setShowAdminLogin(false);
    } else {
      setShowAdminLogin(true);
    }
  };

  if (showAdminLogin && !adminLoggedIn) {
    return (
      <AdminLogin
        onBackToLanding={() => {
          setShowAdminLogin(false);
          setCurrentPortal('landing');
        }}
      />
    );
  }

  if (currentPortal === 'public') {
    return (
      <PublicPortal
        onBackToLanding={() => setCurrentPortal('landing')}
        onGoToAdmin={handleOpenAdmin}
      />
    );
  }

  if (currentPortal === 'admin') {
    if (!adminLoggedIn) {
      return (
        <AdminLogin
          onBackToLanding={() => {
            setCurrentPortal('landing');
          }}
        />
      );
    }
    return <AdminPortal />;
  }

  // Default: Landing Page with 2 Portals
  return (
    <LandingPage
      onOpenPublic={() => setCurrentPortal('public')}
      onOpenAdmin={handleOpenAdmin}
    />
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
