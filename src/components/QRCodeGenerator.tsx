import { useRef, useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import { Download, Printer, Eye, MousePointerClick } from 'lucide-react'
import html2canvas from 'html2canvas'
import { getEmployeeAnalytics } from '@/services/analyticsService'

interface QRCodeGeneratorProps {
  url: string
  employeeName?: string
  employeeId?: string
}

export default function QRCodeGenerator({ url, employeeName, employeeId }: QRCodeGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const [analytics, setAnalytics] = useState({ view_count: 0, click_count: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (employeeId) {
      loadAnalytics()
    } else {
      setLoading(false)
    }
  }, [employeeId])

  const loadAnalytics = async () => {
    if (!employeeId) return
    setLoading(true)
    const data = await getEmployeeAnalytics(employeeId)
    setAnalytics(data)
    setLoading(false)
  }

  const handleDownload = async () => {
    if (!qrRef.current) return

    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      })

      const link = document.createElement('a')
      link.download = `${employeeName || 'qr-code'}-qr.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error downloading QR code:', error)
      alert('Failed to download QR code')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      <div
        ref={qrRef}
        className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border mx-auto"
        style={{ width: '400px', minHeight: '400px' }}
      >
        <QRCode
          value={url}
          size={300}
          style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
          viewBox="0 0 256 256"
        />
        {employeeName && (
          <p className="mt-4 text-sm font-medium text-center">{employeeName}</p>
        )}
      </div>
      <div className="flex space-x-2">
        <Button onClick={handleDownload} className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Download PNG
        </Button>
        <Button onClick={handlePrint} variant="outline" className="flex-1">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>
      <div className="p-3 bg-muted rounded-md">
        <p className="text-xs text-muted-foreground mb-1">Public URL:</p>
        <p className="text-sm break-all">{url}</p>
      </div>
      
      {employeeId && (
        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-xs font-medium text-blue-900 mb-2">Statistics</p>
          {loading ? (
            <p className="text-xs text-blue-700">Loading...</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  <span className="font-semibold">{analytics.view_count}</span> Views
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MousePointerClick className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  <span className="font-semibold">{analytics.click_count}</span> Clicks
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

