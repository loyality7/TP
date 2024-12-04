import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import ProtectedRoute from './components/auth/ProtectedRoute';
import VendorDashboard from './components/vendor/Dashboard/Dashboard';

// Import pages
import Home from './pages/home/home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/profile/profile';
// import UserDashboardPage from './pages/dashboard/candidate/UserDashboard';
import AdminDashboardPage from './pages/dashboard/admin/AdminDashboard';
import CreateTest from './components/vendor/Assessments/CreateTest';
import SharedTest from './pages/test/SharedTest';
import TakeTest from './pages/test/TakeTest';
import TestCompleted from './pages/test/TestCompleted';
import Proctoring from './pages/test/Proctoring';
import Statistics from './components/vendor/Dashboard/Statistics';
import Reports from './components/vendor/Dashboard/Reports';
import AllTests from './components/vendor/Assessments/AllTests';
// import Templates from './components/vendor/Assessments/Templates';
import QuestionBank from './components/vendor/Assessments/QuestionBank';
import Archive from './components/vendor/Assessments/Archive';
import AllCandidates from './components/vendor/Candidates/AllCandidates';
import ActiveCandidates from './components/vendor/Candidates/ActiveCandidates';
import CompletedCandidates from './components/vendor/Candidates/CompletedCandidates';
import PendingCandidates from './components/vendor/Candidates/PendingCandidates';
import TestAnalytics from './components/vendor/Analytics/TestAnalytics';
import CandidateAnalytics from './components/vendor/Analytics/CandidateAnalytics';
import PerformanceInsights from './components/vendor/Analytics/PerformanceInsights';
import CustomReports from './components/vendor/Analytics/CustomReports';
import UpcomingTests from './components/vendor/Schedule/UpcomingTests';
import PastTests from './components/vendor/Schedule/PastTests';
import CalendarView from './components/vendor/Schedule/CalendarView';
import Documentation from './components/vendor/Resources/Documentation';
import APIAccess from './components/vendor/Resources/APIAccess';
import Guides from './components/vendor/Resources/Guides';
import Support from './components/vendor/Resources/Support';
import Billing from './components/vendor/Payments/Billing';
import Invoices from './components/vendor/Payments/Invoices';
import Subscription from './components/vendor/Payments/Subscription';
import PaymentHistory from './components/vendor/Payments/PaymentHistory';
import { Toaster } from 'react-hot-toast';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import { QueryProvider } from './providers/QueryProvider';
import Wallet from './components/vendor/Payments/Wallet';

// Create a wrapper component to handle header visibility
const AppContent = () => {
  const location = useLocation();
  
  // Define routes where header should be hidden
  const noHeaderRoutes = [
    '/test/take',
    '/test/shared',
    '/test/completed',
    '/test/proctoring',
    '/vendor/dashboard'
    
  ];

  // Check if current path starts with any of the noHeaderRoutes
  const shouldShowHeader = !noHeaderRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  return (
    <>
      {shouldShowHeader && <Header />}
      <div className={shouldShowHeader ? "pt-16" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/profile" 
            
            element={<ProtectedRoute element={<Profile />} allowedRoles={['user', 'vendor', 'admin']} />} 
          />
          {/* <Route 
            path="/dashboard/user" 
            element={<ProtectedRoute element={<UserDashboardPage />} allowedRoles={['user', 'admin']} />} 
          /> */}
          <Route 
            path="/dashboard/admin" 
            element={<ProtectedRoute element={<AdminDashboardPage />} allowedRoles={['admin']} />} 
          />
          <Route 
            path="/vendor/*" 
            element={
              <ProtectedRoute 
                element={
                  <Routes>
                    <Route path="dashboard" element={<VendorDashboard />} />
                    <Route path="dashboard/statistics" element={<Statistics />} />
                    <Route path="dashboard/reports" element={<Reports />} />
                    <Route path="tests" element={<AllTests />} />
                    <Route path="tests/create" element={<CreateTest />} />
                    {/* <Route path="tests/templates" element={<Templates />} /> */}
                    <Route path="tests/questions" element={<QuestionBank />} />
                    <Route path="tests/archive" element={<Archive />} />
                    <Route path="candidates" element={<AllCandidates />} />
                    <Route path="candidates/active" element={<ActiveCandidates />} />
                    <Route path="candidates/completed" element={<CompletedCandidates />} />
                    <Route path="candidates/pending" element={<PendingCandidates />} />
                    <Route path="analytics/tests" element={<TestAnalytics />} />
                    <Route path="analytics/candidates" element={<CandidateAnalytics />} />
                    <Route path="analytics/insights" element={<PerformanceInsights />} />
                    <Route path="analytics/reports" element={<CustomReports />} />
                    <Route path="schedule/upcoming" element={<UpcomingTests />} />
                    <Route path="schedule/past" element={<PastTests />} />
                    <Route path="schedule/calendar" element={<CalendarView />} />
                    <Route path="resources/docs" element={<Documentation />} />
                    <Route path="resources/api" element={<APIAccess />} />
                    <Route path="resources/guides" element={<Guides />} />
                    <Route path="resources/support" element={<Support />} />
                    <Route path="payments/billing" element={<Billing />} />
                    <Route path="payments/invoices" element={<Invoices />} />
                    <Route path="payments/subscription" element={<Subscription />} />
                    <Route path="payments/history" element={<PaymentHistory />} />
                    <Route path="payments/wallet" element={<Wallet />} />
                  </Routes>
                } 
                allowedRoles={['vendor', 'admin']} 
              />
            } 
          />
          <Route path="/test/shared/:uuid" element={<SharedTest />} />
          <Route path="/test/take/:uuid" element={<TakeTest />} />
          <Route path="/test/completed" element={<TestCompleted />} />
          <Route path="/test/proctoring/:testId" element={<Proctoring />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </>
  );
};

const App = () => {
  return (
    <QueryProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </QueryProvider>
  );
};

export default App;
