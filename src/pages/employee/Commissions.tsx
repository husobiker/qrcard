import { useEffect, useState } from 'react'
import { getEmployeeSession } from '@/services/employeeAuthService'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  getCommissionPayments,
} from '@/services/commissionService'
import type { CommissionPayment, PaymentStatus } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, CheckCircle, Clock } from 'lucide-react'

export default function EmployeeCommissions() {
  const { t } = useLanguage()
  const [employee, setEmployee] = useState<{ id: string; company_id: string } | null>(null)
  const [payments, setPayments] = useState<CommissionPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (employee) {
      loadPayments()
    }
  }, [employee, statusFilter])

  const loadData = async () => {
    const sessionEmployee = getEmployeeSession()
    if (sessionEmployee) {
      setEmployee(sessionEmployee)
    }
    setLoading(false)
  }

  const loadPayments = async () => {
    if (!employee) return
    const paymentsData = await getCommissionPayments(undefined, employee.id)
    setPayments(paymentsData)
  }

  const filteredPayments = payments.filter((payment) => {
    if (statusFilter !== 'all' && payment.payment_status !== statusFilter) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Komisyonlarım</h1>
        <p className="text-muted-foreground">Komisyon ödemelerinizi görüntüleyin</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
        >
          <option value="all">Tüm Ödemeler</option>
          <option value="pending">Bekleyen</option>
          <option value="paid">Ödenen</option>
          <option value="cancelled">İptal</option>
        </select>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-muted-foreground mb-2">Komisyon ödemesi bulunamadı</p>
            <p className="text-sm text-muted-foreground">Size ait komisyon ödemesi bulunmamaktadır</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">
                        {payment.commission_amount.toLocaleString('tr-TR')} ₺
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.payment_status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : payment.payment_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.payment_status === 'paid' ? 'Ödendi' :
                         payment.payment_status === 'pending' ? 'Bekliyor' : 'İptal'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {payment.payment_date && (
                        <span>
                          Ödeme Tarihi: {new Date(payment.payment_date).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                      <span>
                        Oluşturulma: {new Date(payment.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    {payment.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{payment.notes}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


