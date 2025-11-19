import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import Dashboard from '@/pages/dashboard/Dashboard'
import Employees from '@/pages/dashboard/Employees'
import Calendar from '@/pages/dashboard/Calendar'
import CRM from '@/pages/dashboard/CRM'
import Reports from '@/pages/dashboard/Reports'
import EmployeeDashboard from '@/pages/employee/Dashboard'
import EmployeeCalendar from '@/pages/employee/Calendar'
import EmployeeCRM from '@/pages/employee/CRM'
import EmployeeReports from '@/pages/employee/Reports'
import EmployeeProfile from '@/pages/public/EmployeeProfile'

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
        <Route path="/login" element={<Login />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
