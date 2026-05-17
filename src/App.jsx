import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import GlobalLayout from './components/layout/GlobalLayout';
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';

// Onboarding Imports
import OnboardingLayout from './components/layout/OnboardingLayout';
import Step1_Income from './pages/Onboarding/Step1_Income';
import Step2_Expenses from './pages/Onboarding/Step2_Expenses';
import Step3_Goals from './pages/Onboarding/Step3_Goals';
import Step4_Risk from './pages/Onboarding/Step4_Risk';
import Step5_Tracking from './pages/Onboarding/Step5_Tracking';

// Dashboard Imports
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';

// Mock components for protected routes
function Explorer() { return <div className="p-8 text-center text-on-surface">Explorer Placeholder</div>; }
function Analysis() { return <div className="p-8 text-center text-on-surface">Analysis Placeholder</div>; }
function Budgets() { return <div className="p-8 text-center text-on-surface">Budgets Placeholder</div>; }
function Settings() { return <div className="p-8 text-center text-on-surface">Settings Placeholder</div>; }

// Protected Route Wrapper
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes without Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Routes with Global Layout */}
          <Route element={<GlobalLayout />}>
            {/* Public */}
            <Route path="/" element={<Landing />} />
          </Route>
            
          {/* Protected Routes with Dashboard Layout */}
          <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Onboarding Wizard Routes (Protected, uses OnboardingLayout) */}
          <Route path="/onboarding" element={<PrivateRoute><OnboardingLayout /></PrivateRoute>}>
            <Route path="step1" element={<Step1_Income />} />
            <Route path="step2" element={<Step2_Expenses />} />
            <Route path="step3" element={<Step3_Goals />} />
            <Route path="step4" element={<Step4_Risk />} />
            <Route path="step5" element={<Step5_Tracking />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
