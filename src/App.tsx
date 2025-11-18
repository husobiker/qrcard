import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from '@/contexts/LanguageContext'
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

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App

