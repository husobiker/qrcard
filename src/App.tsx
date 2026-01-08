import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import EmployeeProtectedRoute from '@/components/EmployeeProtectedRoute'
import Layout from '@/components/Layout'
import EmployeeLayout from '@/components/EmployeeLayout'
import Login from '@/pages/auth/Login'
import EmployeeLogin from '@/pages/auth/EmployeeLogin'
import Signup from '@/pages/auth/Signup'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import VerifyEmail from '@/pages/auth/VerifyEmail'
import Dashboard from '@/pages/dashboard/Dashboard'
import Employees from '@/pages/dashboard/Employees'
import Calendar from '@/pages/dashboard/Calendar'
import CRM from '@/pages/dashboard/CRM'
import Reports from '@/pages/dashboard/Reports'
import Tasks from '@/pages/dashboard/Tasks'
import Goals from '@/pages/dashboard/Goals'
import Transactions from '@/pages/dashboard/Transactions'
import Communications from '@/pages/dashboard/Communications'
import Commissions from '@/pages/dashboard/Commissions'
import CallLogs from '@/pages/dashboard/CallLogs'
import VehicleTracking from '@/pages/dashboard/VehicleTracking'
import EmployeeDashboard from '@/pages/employee/Dashboard'
import EmployeeCalendar from '@/pages/employee/Calendar'
import EmployeeCRM from '@/pages/employee/CRM'
import EmployeeReports from '@/pages/employee/Reports'
import EmployeeTasks from '@/pages/employee/Tasks'
import EmployeeGoals from '@/pages/employee/Goals'
import EmployeeTransactions from '@/pages/employee/Transactions'
import EmployeeCommunications from '@/pages/employee/Communications'
import EmployeeCommissions from '@/pages/employee/Commissions'
import EmployeeCallLogs from '@/pages/employee/CallLogs'
import EmployeeProfile from '@/pages/public/EmployeeProfile'
import Landing from '@/pages/Landing'

// Component to handle URL hash errors (e.g., from email links)
function ErrorHandler() {
  const location = useLocation()
  const { t } = useLanguage()

  useEffect(() => {
    // Check for error in URL hash
    const hash = location.hash
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1))
      const errorCode = params.get('error_code')
      const errorDescription = params.get('error_description')
      
      if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
        alert(t('auth.signup.otpExpired'))
        // Clean up URL
        window.history.replaceState(null, '', location.pathname)
      }
    }
  }, [location, t])

  return null
}

function AppRoutes() {
  return (
    <>
      <ErrorHandler />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/:companyId/:employeeId"
          element={<EmployeeProfile />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employees"
          element={
            <ProtectedRoute>
              <Layout>
                <Employees />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <Calendar />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/crm"
          element={
            <ProtectedRoute>
              <Layout>
                <CRM />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tasks"
          element={
            <ProtectedRoute>
              <Layout>
                <Tasks />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/goals"
          element={
            <ProtectedRoute>
              <Layout>
                <Goals />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/transactions"
          element={
            <ProtectedRoute>
              <Layout>
                <Transactions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/communications"
          element={
            <ProtectedRoute>
              <Layout>
                <Communications />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/commissions"
          element={
            <ProtectedRoute>
              <Layout>
                <Commissions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/call-logs"
          element={
            <ProtectedRoute>
              <Layout>
                <CallLogs />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/vehicles"
          element={
            <ProtectedRoute>
              <Layout>
                <VehicleTracking />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/dashboard"
          element={
            <EmployeeProtectedRoute>
              <EmployeeLayout>
                <EmployeeDashboard />
              </EmployeeLayout>
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/employee/calendar"
          element={
            <EmployeeProtectedRoute>
              <EmployeeLayout>
                <EmployeeCalendar />
              </EmployeeLayout>
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/employee/crm"
          element={
            <EmployeeProtectedRoute>
              <EmployeeLayout>
                <EmployeeCRM />
              </EmployeeLayout>
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/employee/reports"
          element={
            <EmployeeProtectedRoute>
              <EmployeeLayout>
                <EmployeeReports />
              </EmployeeLayout>
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/employee/tasks"
          element={
            <EmployeeProtectedRoute>
              <EmployeeLayout>
                <EmployeeTasks />
              </EmployeeLayout>
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/employee/goals"
          element={
            <EmployeeProtectedRoute>
              <EmployeeLayout>
                <EmployeeGoals />
              </EmployeeLayout>
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/employee/transactions"
          element={
            <EmployeeProtectedRoute>
              <EmployeeLayout>
                <EmployeeTransactions />
              </EmployeeLayout>
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/employee/communications"
          element={
            <EmployeeProtectedRoute>
              <EmployeeLayout>
                <EmployeeCommunications />
              </EmployeeLayout>
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/employee/commissions"
          element={
            <EmployeeProtectedRoute>
              <EmployeeLayout>
                <EmployeeCommissions />
              </EmployeeLayout>
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/employee/call-logs"
          element={
            <EmployeeProtectedRoute>
              <EmployeeLayout>
                <EmployeeCallLogs />
              </EmployeeLayout>
            </EmployeeProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
