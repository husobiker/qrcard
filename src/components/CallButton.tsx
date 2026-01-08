import { useState } from 'react'
import { Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CallInterface from './CallInterface'
import type { EmployeeSipSettings, Company } from '@/types'

interface CallButtonProps {
  employeeSipSettings: EmployeeSipSettings | null
  company?: Company | null
  phoneNumber?: string
  customerName?: string
  customerId?: string | null
  companyId: string
  employeeId: string
}

export default function CallButton({
  employeeSipSettings,
  company,
  phoneNumber,
  customerName,
  customerId,
  companyId,
  employeeId,
}: CallButtonProps) {
  const [showCallInterface, setShowCallInterface] = useState(false)

  if (!employeeSipSettings) {
    return null
  }

  return (
    <>
      <Button
        onClick={() => setShowCallInterface(true)}
        className="flex items-center gap-2"
        variant="outline"
      >
        <Phone className="h-4 w-4" />
        Ara
      </Button>
      {showCallInterface && (
        <CallInterface
          employeeSipSettings={employeeSipSettings}
          company={company}
          phoneNumber={phoneNumber}
          customerName={customerName}
          customerId={customerId}
          companyId={companyId}
          employeeId={employeeId}
          onClose={() => setShowCallInterface(false)}
        />
      )}
    </>
  )
}

