import { Navigate } from 'react-router-dom'
import { getEmployeeSession } from '@/services/employeeAuthService'

interface EmployeeProtectedRouteProps {
  children: React.ReactNode
}

export default function EmployeeProtectedRoute({ children }: EmployeeProtectedRouteProps) {
  const employee = getEmployeeSession()

  if (!employee) {
    return <Navigate to="/employee-login" replace />
  }

  return <>{children}</>
}

