import { useEffect, useState } from 'react'
import { getEmployeeSession } from '@/services/employeeAuthService'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTransactions } from '@/services/transactionService'
import type { Transaction, TransactionType } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function EmployeeTransactions() {
  useLanguage() // Language context
  const [employee, setEmployee] = useState<{ id: string; company_id: string } | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (employee) {
      loadTransactions()
    }
  }, [employee, typeFilter])

  const loadData = async () => {
    const sessionEmployee = getEmployeeSession()
    if (sessionEmployee) {
      setEmployee(sessionEmployee)
    }
    setLoading(false)
  }

  const loadTransactions = async () => {
    if (!employee) return
    const transactionsData = await getTransactions(undefined, employee.id)
    setTransactions(transactionsData)
  }

  const filteredTransactions = transactions.filter((transaction) => {
    if (typeFilter !== 'all' && transaction.transaction_type !== typeFilter) return false
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
        <h1 className="text-3xl font-bold">İşlemlerim</h1>
        <p className="text-muted-foreground">Size ait finansal işlemleri görüntüleyin</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
        >
          <option value="all">Tüm İşlemler</option>
          <option value="income">Gelir</option>
          <option value="expense">Gider</option>
        </select>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-muted-foreground mb-2">İşlem bulunamadı</p>
            <p className="text-sm text-muted-foreground">Size ait işlem bulunmamaktadır</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {transaction.transaction_type === 'income' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                      <h3 className="text-lg font-semibold">{transaction.category}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        transaction.transaction_type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.transaction_type === 'income' ? 'Gelir' : 'Gider'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                      <span className="text-lg font-bold text-foreground">
                        {transaction.amount.toLocaleString('tr-TR')} {transaction.currency}
                      </span>
                      {transaction.payment_method && (
                        <span>Ödeme: {transaction.payment_method}</span>
                      )}
                      <span>
                        Tarih: {new Date(transaction.transaction_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-muted-foreground">{transaction.description}</p>
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


