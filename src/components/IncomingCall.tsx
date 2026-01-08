import { useState, useEffect } from 'react'
import { Phone, PhoneOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createCallLog } from '@/services/callLogService'
import type { CallLogFormData } from '@/types'

interface IncomingCallProps {
  phoneNumber: string
  customerName?: string
  customerId?: string | null
  companyId: string
  employeeId: string
  onAnswer: () => void
  onReject: () => void
}

export default function IncomingCall({
  phoneNumber,
  customerName,
  customerId,
  companyId,
  employeeId,
  onAnswer,
  onReject,
}: IncomingCallProps) {
  const [callStartTime] = useState(new Date())

  const handleReject = async () => {
    // Save missed call log
    const callLogData: CallLogFormData = {
      employee_id: employeeId,
      call_type: 'missed',
      phone_number: phoneNumber,
      customer_name: customerName || null,
      customer_id: customerId || null,
      call_duration: 0,
      call_status: 'no_answer',
      call_start_time: callStartTime.toISOString(),
      call_end_time: new Date().toISOString(),
    }
    await createCallLog(companyId, callLogData)
    onReject()
  }

  const handleAnswer = () => {
    onAnswer()
  }

  return (
    <Dialog open={true} onOpenChange={handleReject}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gelen Arama</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <div className="text-lg font-semibold">
            {customerName || phoneNumber}
          </div>
          <div className="text-sm text-muted-foreground">{phoneNumber}</div>

          <div className="flex justify-center gap-4">
            <Button
              onClick={handleAnswer}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Phone className="h-4 w-4" />
              Cevapla
            </Button>
            <Button
              onClick={handleReject}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <PhoneOff className="h-4 w-4" />
              Reddet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


