import './style.css';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import AccountComponent from './components/AccountComponent';
import AdminDashboard from './components/AdminDashboard';
import LoginComponent from './components/LoginComponent';
import CashierDashboard from './components/CashierDashboard';
import Navbar from './components/Navbar';
import DirectorDashboard from './components/DirectorDashboard';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [activeTab, setActiveTab] = useState('accounts');

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    const credentials = localStorage.getItem('credentials');
    const storedUsername = localStorage.getItem('username');
    const storedFullName = localStorage.getItem('fullName');
    if (storedRole && credentials) {
      setIsLoggedIn(true);
      setUserRole(storedRole);
      if (storedUsername) {
        setUsername(storedUsername);
      }
      if (storedFullName) {
        setFullName(storedFullName);
      }
    }
  }, []);

  const handleLogin = (role: string, username: string, fullName: string) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setUsername(username);
    setFullName(fullName);
  };

  const handleLogout = () => {
    localStorage.removeItem('credentials');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
    setIsLoggedIn(false);
    setUserRole('');
    setUsername('');
    setFullName('');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoggedIn && (
        <Navbar 
          isLoggedIn={isLoggedIn} 
          onLogout={handleLogout} 
          username={username} 
          userRole={userRole} 
          fullName={fullName} 
          onTabChange={handleTabChange}
        />
      )}
      
      <main className={`${!isLoggedIn ? 'pt-0' : 'pt-0'}`}>
        {!isLoggedIn ? (
          <LoginComponent onLogin={handleLogin} />
        ) : userRole === 'ROLE_ADMIN' ? (
          <AdminDashboard />
        ) : userRole === 'ROLE_CASHIER' ? (
          <CashierDashboard />
        ) : userRole === 'ROLE_DIRECTOR' ? (
          <DirectorDashboard />
        ) : (
          <AccountComponent activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
      </main>
    </div>
  );
};

// Créer le routeur avec toutes les futures flags
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="*" element={<App />} />
  ),
  {
    future: {
      v7_startTransition: true
    }
  }
);

// Rendu de l'application avec StrictMode désactivé pour éviter les doubles rendus
ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider 
      router={router}
      future={{
        v7_startTransition: true
      }}
    />
  </React.StrictMode>
); 