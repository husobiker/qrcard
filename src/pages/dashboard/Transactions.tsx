import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCompanyByUserId } from '@/services/companyService'
import { getEmployeesByCompany } from '@/services/employeeService'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
} from '@/services/transactionService'
import type { Transaction, TransactionFormData, TransactionType, Employee } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Filter, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

const transactionCategories = [
  'Satış',
  'Hizmet',
  'Ürün',
  'Kira',
  'Maaş',
  'Ofis Giderleri',
  'Pazarlama',
  'Ulaştırma',
  'Diğer',
]

const paymentMethods = [
  'Nakit',
  'Banka Transferi',
  'Kredi Kartı',
  'Çek',
  'Diğer',
]

export default function Transactions() {
  const { user } = useAuth()
  useLanguage() // Language context
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({
    total_income: 0,
    total_expense: 0,
    net_amount: 0,
    income_count: 0,
    expense_count: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])

  const [formData, setFormData] = useState<TransactionFormData>({
    employee_id: null,
    transaction_type: 'income',
    category: '',
    amount: 0,
    currency: 'TRY',
    payment_method: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadData()
  }, [user])

  useEffect(() => {
    if (companyId) {
      loadTransactions()
      loadStats()
      loadEmployees()
    }
  }, [companyId, typeFilter, startDate, endDate])

  const loadEmployees = async () => {
    if (!companyId) return
    const employeesData = await getEmployeesByCompany(companyId)
    setEmployees(employeesData)
  }

  const loadData = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    const company = await getCompanyByUserId(user.id)
    if (company) {
      setCompanyId(company.id)
    }
    setLoading(false)
  }

  const loadTransactions = async () => {
    if (!companyId) return
    const transactionsData = await getTransactions(companyId, undefined, startDate || undefined, endDate || undefined)
    setTransactions(transactionsData)
  }

  const loadStats = async () => {
    if (!companyId) return
    const statsData = await getTransactionStats(companyId, undefined, startDate || undefined, endDate || undefined)
    setStats(statsData)
  }

  const handleOpenDialog = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction)
      setFormData({
        employee_id: transaction.employee_id,
        transaction_type: transaction.transaction_type,
        category: transaction.category,
        amount: transaction.amount,
        currency: transaction.currency,
        payment_method: transaction.payment_method || '',
        description: transaction.description || '',
        transaction_date: transaction.transaction_date,
      })
    } else {
      setEditingTransaction(null)
      setFormData({
        employee_id: null,
        transaction_type: 'income',
        category: '',
        amount: 0,
        currency: 'TRY',
        payment_method: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingTransaction(null)
  }

  const handleSave = async () => {
    if (!companyId || !formData.category || formData.amount <= 0) return

    if (editingTransaction) {
      const updated = await updateTransaction(editingTransaction.id, formData)
      if (updated) {
        await loadTransactions()
        await loadStats()
        handleCloseDialog()
      }
    } else {
      const created = await createTransaction(companyId, formData)
      if (created) {
        await loadTransactions()
        await loadStats()
        handleCloseDialog()
      }
    }
  }

  const handleDelete = async (transactionId: string) => {
    if (!window.confirm('Bu işlemi silmek istediğinize emin misiniz?')) return

    const success = await deleteTransaction(transactionId)
    if (success) {
      await loadTransactions()
      await loadStats()
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finansal İşlemler</h1>
          <p className="text-muted-foreground">Gelir ve gider kayıtlarını yönetin</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni İşlem
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Toplam Gelir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.total_income.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-muted-foreground mt-1">{stats.income_count} işlem</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Toplam Gider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.total_expense.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-muted-foreground mt-1">{stats.expense_count} işlem</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Net Tutar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.net_amount.toLocaleString('tr-TR')} ₺
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
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
        <div>
          <Input
            type="date"
            placeholder="Başlangıç Tarihi"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-48"
          />
        </div>
        <div>
          <Input
            type="date"
            placeholder="Bitiş Tarihi"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-muted-foreground mb-2">İşlem bulunamadı</p>
            <p className="text-sm text-muted-foreground mb-4">Yeni işlem ekleyerek başlayın</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni İşlem
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTransactions.map((transaction) => {
            const employee = transaction.employee_id ? employees.find((e) => e.id === transaction.employee_id) : null
            
            return (
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
                        {employee && (
                          <span>Çalışan: {employee.first_name} {employee.last_name}</span>
                        )}
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
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Transaction Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={handleCloseDialog}>
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'İşlemi Düzenle' : 'Yeni İşlem Ekle'}
            </DialogTitle>
            <DialogDescription>
              {editingTransaction ? 'İşlem bilgilerini düzenleyin' : 'Yeni finansal işlem ekleyin'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="transaction_type">İşlem Tipi *</Label>
              <select
                id="transaction_type"
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as TransactionType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="income">Gelir</option>
                <option value="expense">Gider</option>
              </select>
            </div>
            <div>
              <Label htmlFor="category">Kategori *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Kategori Seçin</option>
                {transactionCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Tutar *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="currency">Para Birimi</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="employee_id">Çalışan (Opsiyonel)</Label>
              <select
                id="employee_id"
                value={formData.employee_id || ''}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Çalışan Seçilmedi</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="payment_method">Ödeme Yöntemi</Label>
              <select
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Ödeme Yöntemi Seçin</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="transaction_date">İşlem Tarihi *</Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog} className="flex-1">
                İptal
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={!formData.category || formData.amount <= 0}>
                Kaydet
              </Button>
            </div>
            {editingTransaction && (
              <div className="pt-2 border-t">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(editingTransaction.id)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  İşlemi Sil
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


