'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Home, ArrowLeft, Check, X, Edit2, Save, Euro, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
// Navigation is provided by the root layout

interface Unit {
  id: string
  name: string
  type: string
  monthlyRent: number
  monthlyUtilities?: number
  propertyId: string
}

interface YearlyOverviewItem {
  month: number
  year: number
  rentAmount: number
  utilitiesAmount: number
  totalAmount: number
  isPaid: boolean
  notes: string
  rentalId: string | null
  exists: boolean
}

const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

export default function YearlyOverviewPage() {
  const [unit, setUnit] = useState<Unit | null>(null)
  const [yearlyOverview, setYearlyOverview] = useState<YearlyOverviewItem[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingCell, setEditingCell] = useState<{ month: number; field: 'notes' | 'rent' | 'utilities' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showStandardRentModal, setShowStandardRentModal] = useState(false)
  const [standardRent, setStandardRent] = useState('')
  const [standardUtilities, setStandardUtilities] = useState('')
  const [effectiveFromMonth, setEffectiveFromMonth] = useState(new Date().getMonth() + 1)
  const [effectiveFromYear, setEffectiveFromYear] = useState(new Date().getFullYear())
  const [warningData, setWarningData] = useState<any>(null)
  const params = useParams()
  const router = useRouter()
  const unitId = params.id as string

  useEffect(() => {
    if (unitId) {
      fetchYearlyOverview()
    }
  }, [unitId, year])

  const fetchYearlyOverview = async () => {
    try {
      const response = await fetch(`/api/units/${unitId}/yearly-overview?year=${year}`)
      if (response.ok) {
        const data = await response.json()
        setUnit(data.unit)
        setYearlyOverview(data.yearlyOverview)
        setStandardRent(data.unit.monthlyRent.toString())
        setStandardUtilities(data.unit.monthlyUtilities?.toString() || '')
      } else {
        setError('Fehler beim Laden der Jahresübersicht')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePaidStatus = async (month: number) => {
    const item = yearlyOverview.find(item => item.month === month)
    if (!item) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/units/${unitId}/yearly-overview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month,
          year,
          isPaid: !item.isPaid,
          notes: item.notes
        }),
      })

      if (response.ok) {
        // Update local state
        setYearlyOverview(prev => prev.map(item => 
          item.month === month 
            ? { ...item, isPaid: !item.isPaid, exists: true }
            : item
        ))
      }
    } catch (err) {
      console.error('Error updating payment status:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const startEditing = (month: number, field: 'notes' | 'rent' | 'utilities', value: string) => {
    setEditingCell({ month, field })
    setEditValue(value)
  }

  const handleEditChange = (value: string) => {
    setEditValue(value)
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
    
    // Set new timeout for auto-save (1 second delay)
    const timeout = setTimeout(() => {
      saveEdit()
    }, 1000)
    
    setAutoSaveTimeout(timeout)
  }

  const saveEdit = async () => {
    if (!editingCell) return

    const item = yearlyOverview.find(item => item.month === editingCell.month)
    if (!item) return

    // Don't save if value hasn't changed
    const currentValue = editingCell.field === 'rent' ? (item.rentAmount || 0) :
                        editingCell.field === 'utilities' ? (item.utilitiesAmount || 0) :
                        item.notes || ''
    
    if (editValue === currentValue.toString()) {
      setEditingCell(null)
      setEditValue('')
      return
    }

    setIsSaving(true)
    try {
      let newAmount = item.totalAmount
      
      if (editingCell.field === 'rent') {
        newAmount = parseFloat(editValue) + (item.utilitiesAmount || 0)
      } else if (editingCell.field === 'utilities') {
        newAmount = (item.rentAmount || 0) + parseFloat(editValue)
      }

      const response = await fetch(`/api/units/${unitId}/yearly-overview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: editingCell.month,
          year,
          isPaid: item.isPaid,
          notes: editingCell.field === 'notes' ? editValue : item.notes,
          rentAmount: editingCell.field === 'rent' ? parseFloat(editValue) : (item.rentAmount || 0),
          utilitiesAmount: editingCell.field === 'utilities' ? parseFloat(editValue) : (item.utilitiesAmount || 0)
        }),
      })

      if (response.ok) {
        // Update local state
        setYearlyOverview(prev => prev.map(item => 
          item.month === editingCell.month 
            ? { 
                ...item, 
                notes: editingCell.field === 'notes' ? editValue : item.notes,
                rentAmount: editingCell.field === 'rent' ? parseFloat(editValue) : (item.rentAmount || 0),
                utilitiesAmount: editingCell.field === 'utilities' ? parseFloat(editValue) : (item.utilitiesAmount || 0),
                totalAmount: newAmount,
                exists: true 
              }
            : item
        ))
        setEditingCell(null)
        setEditValue('')
        // Refresh the data to ensure consistency
        fetchYearlyOverview()
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        setError(errorData.error || 'Fehler beim Speichern')
      }
    } catch (err) {
      console.error('Error updating rental:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const cancelEdit = () => {
    // Clear timeout if exists
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
      setAutoSaveTimeout(null)
    }
    setEditingCell(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  const handleStandardRentUpdate = async (forceUpdate = false) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/units/${unitId}/standard-rent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monthlyRent: parseFloat(standardRent),
          monthlyUtilities: standardUtilities ? parseFloat(standardUtilities) : null,
          effectiveFromMonth,
          effectiveFromYear,
          forceUpdate
        }),
      })

      if (response.status === 409) {
        // Warning about existing non-standard values
        const warningResponse = await response.json()
        setWarningData(warningResponse)
        return
      }

      if (response.ok) {
        setShowStandardRentModal(false)
        setWarningData(null)
        // Refresh the data
        fetchYearlyOverview()
      } else {
        const data = await response.json()
        setError(data.error || 'Fehler beim Aktualisieren der Standard-Miete')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsSaving(false)
    }
  }

  const confirmStandardRentUpdate = () => {
    handleStandardRentUpdate(true)
  }

  const calculateTotals = () => {
    const totalRent = yearlyOverview.reduce((sum, item) => sum + item.rentAmount, 0)
    const totalUtilities = yearlyOverview.reduce((sum, item) => sum + item.utilitiesAmount, 0)
    const totalExpected = yearlyOverview.reduce((sum, item) => sum + item.totalAmount, 0)
    const totalPaid = yearlyOverview
      .filter(item => item.isPaid)
      .reduce((sum, item) => sum + item.totalAmount, 0)
    const totalUnpaid = totalExpected - totalPaid

    return { totalRent, totalUtilities, totalExpected, totalPaid, totalUnpaid }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Laden...</div>
        </div>
      </div>
    )
  }

  if (error || !unit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">{error || 'Einheit nicht gefunden'}</div>
          <div className="text-center mt-4">
            <Link href="/dashboard">
              <Button>Zurück zum Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const totals = calculateTotals()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/properties/${unit?.propertyId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Objekt
          </Link>
        </div>

        {/* Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Home className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <CardTitle className="text-2xl">{unit.name}</CardTitle>
                  <CardDescription>Jahresübersicht {year}</CardDescription>
                </div>
              </div>

            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Euro className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                <p className="text-sm text-gray-600">Miete gesamt</p>
                <p className="text-xl font-bold">{formatCurrency(totals.totalRent)}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Euro className="w-6 h-6 mx-auto text-green-600 mb-2" />
                <p className="text-sm text-gray-600">Nebenkosten gesamt</p>
                <p className="text-xl font-bold">{formatCurrency(totals.totalUtilities)}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Check className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                <p className="text-sm text-gray-600">Bezahlt</p>
                <p className="text-xl font-bold">{formatCurrency(totals.totalPaid)}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <X className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                <p className="text-sm text-gray-600">Offen</p>
                <p className="text-xl font-bold">{formatCurrency(totals.totalUnpaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle>Monatliche Übersicht</CardTitle>
                <CardDescription>
                  Klicken Sie auf die Checkbox um den Zahlungsstatus zu ändern. 
                  Klicken Sie auf Beträge oder Notizen um diese direkt zu bearbeiten (Excel-ähnlich).
                  Enter = Speichern, Escape = Abbrechen, Auto-Save nach 1 Sekunde.
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStandardRentModal(true)}
                >
                  Standard-Miete bearbeiten
                </Button>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Jahr</p>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium" style={{width: '12%'}}>Monat</th>
                    <th className="text-left p-3 font-medium" style={{width: '20%'}}>Miete</th>
                    <th className="text-left p-3 font-medium" style={{width: '20%'}}>Nebenkosten</th>
                    <th className="text-left p-3 font-medium" style={{width: '20%'}}>Gesamt</th>
                    <th className="text-left p-3 font-medium" style={{width: '10%'}}>Bezahlt</th>
                    <th className="text-left p-3 font-medium" style={{width: '18%'}}>Notizen</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyOverview.map((item) => (
                    <tr key={item.month} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">
                        {monthNames[item.month - 1]}
                      </td>
                      <td className="p-3 text-left">
                        {editingCell?.month === item.month && editingCell?.field === 'rent' ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editValue}
                            onChange={(e) => handleEditChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={saveEdit}
                            className="w-24 text-left border-2 border-blue-500 bg-blue-50"
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="font-semibold text-left cursor-pointer hover:bg-blue-100 hover:border hover:border-blue-300 px-2 py-1 rounded min-w-[80px] border border-transparent transition-all duration-200 bg-gray-50"
                            onClick={() => startEditing(item.month, 'rent', (item.rentAmount || 0).toString())}
                          >
                            {formatCurrency(item.rentAmount || 0)}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-left">
                        {editingCell?.month === item.month && editingCell?.field === 'utilities' ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editValue}
                            onChange={(e) => handleEditChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={saveEdit}
                            className="w-24 text-left border-2 border-blue-500 bg-blue-50"
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="font-semibold text-left cursor-pointer hover:bg-blue-100 hover:border hover:border-blue-300 px-2 py-1 rounded min-w-[80px] border border-transparent transition-all duration-200 bg-gray-50"
                            onClick={() => startEditing(item.month, 'utilities', (item.utilitiesAmount || 0).toString())}
                          >
                            {formatCurrency(item.utilitiesAmount || 0)}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-left">
                        <span className="font-semibold w-full text-left block">
                          {formatCurrency((item.rentAmount || 0) + (item.utilitiesAmount || 0))}
                        </span>
                      </td>
                      <td className="p-3 text-left">
                        <button
                          onClick={() => togglePaidStatus(item.month)}
                          disabled={isSaving}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            item.isPaid
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-white border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {item.isPaid && <Check className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="p-3 text-left">
                        {editingCell?.month === item.month && editingCell?.field === 'notes' ? (
                          <Input
                            value={editValue}
                            onChange={(e) => handleEditChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={saveEdit}
                            className="w-full border-2 border-blue-500 bg-blue-50"
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="text-sm cursor-pointer hover:bg-blue-100 hover:border hover:border-blue-300 px-2 py-1 rounded min-h-[24px] flex items-center border border-transparent transition-all duration-200 bg-gray-50"
                            onClick={() => startEditing(item.month, 'notes', item.notes || '')}
                          >
                            {item.notes || '-'}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {yearlyOverview.map((item) => (
                <div key={item.month} className="border rounded-lg p-4 hover:bg-gray-50">
                  {/* Month Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{monthNames[item.month - 1]}</h3>
                    <button
                      onClick={() => togglePaidStatus(item.month)}
                      disabled={isSaving}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                        item.isPaid
                          ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                          : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'
                      }`}
                      title={item.isPaid ? 'Bezahlt' : 'Offen'}
                    >
                      {item.isPaid && <Check className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Amounts Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Miete</label>
                      {editingCell?.month === item.month && editingCell?.field === 'rent' ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValue}
                          onChange={(e) => handleEditChange(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={saveEdit}
                          className="w-full border-2 border-blue-500 bg-blue-50"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="font-semibold cursor-pointer hover:bg-blue-100 hover:border hover:border-blue-300 px-3 py-2 rounded border border-transparent transition-all duration-200 bg-gray-50"
                          onClick={() => startEditing(item.month, 'rent', (item.rentAmount || 0).toString())}
                        >
                          {formatCurrency(item.rentAmount || 0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nebenkosten</label>
                      {editingCell?.month === item.month && editingCell?.field === 'utilities' ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValue}
                          onChange={(e) => handleEditChange(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={saveEdit}
                          className="w-full border-2 border-blue-500 bg-blue-50"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="font-semibold cursor-pointer hover:bg-blue-100 hover:border hover:border-blue-300 px-3 py-2 rounded border border-transparent transition-all duration-200 bg-gray-50"
                          onClick={() => startEditing(item.month, 'utilities', (item.utilitiesAmount || 0).toString())}
                        >
                          {formatCurrency(item.utilitiesAmount || 0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">Gesamt</label>
                    <div className="font-semibold text-lg">
                      {formatCurrency((item.rentAmount || 0) + (item.utilitiesAmount || 0))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Notizen</label>
                    {editingCell?.month === item.month && editingCell?.field === 'notes' ? (
                      <Input
                        value={editValue}
                        onChange={(e) => handleEditChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={saveEdit}
                        className="w-full border-2 border-blue-500 bg-blue-50"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="text-sm cursor-pointer hover:bg-blue-100 hover:border hover:border-blue-300 px-3 py-2 rounded min-h-[40px] flex items-center border border-transparent transition-all duration-200 bg-gray-50"
                        onClick={() => startEditing(item.month, 'notes', item.notes || '')}
                      >
                        {item.notes || '-'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Standard Rent Modal */}
        {showStandardRentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4">Standard-Miete bearbeiten</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monatliche Miete (€) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={standardRent}
                    onChange={(e) => setStandardRent(e.target.value)}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nebenkosten (€)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={standardUtilities}
                    onChange={(e) => setStandardUtilities(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gültig ab Monat
                    </label>
                    <select
                      value={effectiveFromMonth}
                      onChange={(e) => setEffectiveFromMonth(parseInt(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gültig ab Jahr
                    </label>
                    <Input
                      type="number"
                      min="2020"
                      max="2030"
                      value={effectiveFromYear}
                      onChange={(e) => setEffectiveFromYear(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  onClick={() => handleStandardRentUpdate()}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Speichern...' : 'Speichern'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStandardRentModal(false)
                    setWarningData(null)
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Warning Modal */}
        {warningData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Achtung</h3>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>{warningData.message}</p>
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700">Betroffene Monate:</h4>
                      <ul className="mt-2 space-y-1">
                        {warningData.affectedRentals.map((rental: any, index: number) => (
                          <li key={index} className="text-sm">
                            {rental.month}/{rental.year}: {formatCurrency(rental.currentAmount)} → {formatCurrency(rental.newAmount)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="destructive"
                  onClick={confirmStandardRentUpdate}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Überschreiben...' : 'Überschreiben'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setWarningData(null)}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
