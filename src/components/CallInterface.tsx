import { useState, useEffect, useRef } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  initializeSip,
  makeCall,
  hangUp,
  disconnect,
  getCallState,
  onCallStateChange,
  type CallState,
} from '@/services/sipService'
import { createCallLog } from '@/services/callLogService'
import type {
  EmployeeSipSettings,
  Company,
  CallLogFormData,
} from '@/types'

interface CallInterfaceProps {
  employeeSipSettings: EmployeeSipSettings
  company?: Company | null
  phoneNumber?: string
  customerName?: string
  customerId?: string | null
  companyId: string
  employeeId: string
  onClose: () => void
}

export default function CallInterface({
  employeeSipSettings,
  company,
  phoneNumber: initialPhoneNumber,
  customerName: initialCustomerName,
  customerId,
  companyId,
  employeeId,
  onClose,
}: CallInterfaceProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || '')
  const [customerName, setCustomerName] = useState(initialCustomerName || '')
  const [callState, setCallState] = useState<CallState>(getCallState())
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const callStartTimeRef = useRef<Date | null>(null)

  useEffect(() => {
    // Initialize SIP connection
    const init = async () => {
      console.log('Initializing SIP with:', { 
        hasCompany: !!company, 
        hasApiSettings: !!(company?.api_endpoint && company?.api_key && company?.santral_id),
        hasSipServer: !!employeeSipSettings?.sip_server 
      })
      const success = await initializeSip(employeeSipSettings, company)
      console.log('SIP initialization result:', success)
      setIsInitialized(success)
      
      if (!success) {
        console.error('SIP initialization failed. Check console for details.')
      }
    }
    init()

    // Subscribe to call state changes
    const unsubscribe = onCallStateChange((state) => {
      setCallState(state)
    })

    return () => {
      unsubscribe()
      disconnect()
    }
  }, [employeeSipSettings, company])

  const handleCall = async () => {
    console.log('handleCall called with:', { phoneNumber, company, employeeSipSettings })
    
    if (!phoneNumber.trim()) {
      alert('Lütfen telefon numarası girin')
      return
    }

    if (!isInitialized) {
      console.error('SIP not initialized')
      alert('SIP bağlantısı hazır değil. Lütfen bekleyin...')
      return
    }

    console.log('Starting call...')
    callStartTimeRef.current = new Date()
    
    try {
      // Pass company and employee settings to makeCall
      const success = await makeCall(phoneNumber, company, employeeSipSettings)
      console.log('makeCall result:', success)
      
      if (!success) {
        alert('Arama başlatılamadı. Konsolu kontrol edin.')
      } else {
        console.log('Call initiated successfully')
      }
    } catch (error) {
      console.error('Error in handleCall:', error)
      alert(`Arama başlatılırken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    }
  }

  const handleHangUp = async () => {
    const endTime = new Date()
    const duration = callStartTimeRef.current
      ? Math.floor((endTime.getTime() - callStartTimeRef.current.getTime()) / 1000)
      : 0

    // Save call log
    if (callStartTimeRef.current) {
      const callLogData: CallLogFormData = {
        employee_id: employeeId,
        call_type: 'outgoing',
        phone_number: phoneNumber,
        customer_name: customerName || null,
        customer_id: customerId || null,
        call_duration: duration,
        call_status: callState.isConnected ? 'completed' : 'failed',
        call_start_time: callStartTimeRef.current.toISOString(),
        call_end_time: endTime.toISOString(),
      }
      await createCallLog(companyId, callLogData)
    }

    await hangUp()
    callStartTimeRef.current = null
  }

  const handleMute = () => {
    if (callState.localStream) {
      callState.localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted
      })
      setIsMuted(!isMuted)
    }
  }

  const handleSpeaker = () => {
    if (callState.remoteAudio) {
      callState.remoteAudio.volume = isSpeakerOn ? 0 : 1
      setIsSpeakerOn(!isSpeakerOn)
    }
  }

  const handleClose = async () => {
    if (callState.isConnected || callState.isRinging) {
      await handleHangUp()
    }
    await disconnect()
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {callState.isConnected || callState.isRinging
              ? 'Arama Devam Ediyor'
              : 'Arama Yap'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isInitialized && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">SIP Bağlantısı Kuruluyor...</p>
              <p className="text-xs">Lütfen bekleyin, bağlantı kurulduktan sonra arama yapabileceksiniz.</p>
            </div>
          )}

          {!callState.isConnected && !callState.isRinging && (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                <p className="font-medium mb-1">📞 Nasıl Arama Yapılır?</p>
                <ol className="list-decimal list-inside space-y-1 text-xs mt-2">
                  <li>Telefon numarasını girin (örn: +90 555 123 4567)</li>
                  <li>"Ara" butonuna tıklayın</li>
                  <li>Tarayıcı mikrofon izni isteyecek - "İzin Ver" seçin</li>
                  <li>Arama başladığında ses kontrollerini kullanabilirsiniz</li>
                </ol>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_name">Müşteri Adı (Opsiyonel)</Label>
                <Input
                  id="customer_name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Müşteri adı (opsiyonel)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Telefon Numarası *</Label>
                <Input
                  id="phone_number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+90 555 123 4567 veya 05551234567"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ülke kodu ile birlikte girin (örn: +90 555 123 4567)
                </p>
              </div>
            </>
          )}

          {(callState.isConnected || callState.isRinging) && (
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold">
                {customerName || phoneNumber}
              </div>
              <div className="text-sm text-muted-foreground">{phoneNumber}</div>
              {callState.isRinging && (
                <div className="text-sm text-muted-foreground">Aranıyor...</div>
              )}
            </div>
          )}

          <div className="flex justify-center gap-4">
            {!callState.isConnected && !callState.isRinging ? (
              <Button
                onClick={handleCall}
                disabled={!isInitialized || !phoneNumber.trim()}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Ara
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleMute}
                  variant="outline"
                  size="icon"
                  disabled={!callState.isConnected}
                >
                  {isMuted ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={handleSpeaker}
                  variant="outline"
                  size="icon"
                  disabled={!callState.isConnected}
                >
                  {isSpeakerOn ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={handleHangUp}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <PhoneOff className="h-4 w-4" />
                  Kapat
                </Button>
              </>
            )}
          </div>

          {isInitialized && !callState.isConnected && !callState.isRinging && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-700 text-center">
              ✓ SIP bağlantısı hazır - Arama yapabilirsiniz
            </div>
          )}

          {!isInitialized && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-700 text-center">
              ⏳ SIP bağlantısı kuruluyor, lütfen bekleyin...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

