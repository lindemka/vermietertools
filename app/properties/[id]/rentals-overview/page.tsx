'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, ArrowLeft, Check, X, Euro, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Navigation from '@/components/navigation'

interface Property {
  id: string
  name: string
  address: string
}

interface Unit {
  id: string
  name: string
  type: string
  monthlyRent: number
  monthlyUtilities?: number
}

interface MonthlyOverviewItem {
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

interface UnitOverview {
  unit: Unit
  monthlyOverview: MonthlyOverviewItem[]
  totals: {
    totalRent: number
    totalUtilities: number
    totalExpected: number
    totalPaid: number
    totalUnpaid: number
  }
}

interface PropertyTotals {
  totalRent: number
  totalUtilities: number
  totalExpected: number
  totalPaid: number
  totalUnpaid: number
}

const monthNames = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
]

export default function PropertyRentalsOverviewPage() {
  const [property, setProperty] = useState<Property | null>(null)
  const [unitsOverview, setUnitsOverview] = useState<UnitOverview[]>([])
  const [propertyTotals, setPropertyTotals] = useState<PropertyTotals | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string

  useEffect(() => {
    if (propertyId) {
      fetchRentalsOverview()
    }
  }, [propertyId, year])

  const fetchRentalsOverview = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/rentals-overview?year=${year}`)
      if (response.ok) {
        const data = await response.json()
        setProperty(data.property)
        setUnitsOverview(data.unitsOverview)
        setPropertyTotals(data.propertyTotals)
      } else {
        setError('Fehler beim Laden der Mieteinnahmen-Übersicht')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePaidStatus = async (unitId: string, month: number) => {
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
          isPaid: !unitsOverview.find(u => u.unit.id === unitId)?.monthlyOverview.find(m => m.month === month)?.isPaid
        }),
      })

      if (response.ok) {
        // Refresh the data to get updated payment status
        await fetchRentalsOverview()
      } else {
        console.error('Error updating payment status')
      }
    } catch (err) {
      console.error('Error updating payment status:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const navigateToUnit = (unitId: string) => {
    router.push(`/units/${unitId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Laden...</div>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">{error || 'Objekt nicht gefunden'}</div>
          <div className="text-center mt-4">
            <Link href="/dashboard">
              <Button>Zurück zum Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/properties/${propertyId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Objekt
          </Link>
        </div>

        {/* Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <CardTitle className="text-2xl">{property.name}</CardTitle>
                  <CardDescription>Mieteinnahmen-Übersicht {year}</CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-4">
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
            {propertyTotals && (
              <div className="grid md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Euro className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-sm text-gray-600">Miete gesamt</p>
                  <p className="text-xl font-bold">{formatCurrency(propertyTotals.totalRent)}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Euro className="w-6 h-6 mx-auto text-green-600 mb-2" />
                  <p className="text-sm text-gray-600">Nebenkosten gesamt</p>
                  <p className="text-xl font-bold">{formatCurrency(propertyTotals.totalUtilities)}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Euro className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-sm text-gray-600">Erwartet</p>
                  <p className="text-xl font-bold">{formatCurrency(propertyTotals.totalExpected)}</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <Check className="w-6 h-6 mx-auto text-emerald-600 mb-2" />
                  <p className="text-sm text-gray-600">Bezahlt</p>
                  <p className="text-xl font-bold">{formatCurrency(propertyTotals.totalPaid)}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <X className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                  <p className="text-sm text-gray-600">Offen</p>
                  <p className="text-xl font-bold">{formatCurrency(propertyTotals.totalUnpaid)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Units Overview Table */}
        <Card>
          <CardHeader>
            <CardTitle>Einheiten-Übersicht</CardTitle>
            <CardDescription>
              Übersicht aller Einheiten und ihrer Mieteinnahmen für {year}. 
              Klicken Sie auf die Kreise um den Zahlungsstatus zu ändern. 
              Klicken Sie auf eine Zeile um zur Einheit zu navigieren.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium sticky left-0 bg-white">Einheit</th>
                    <th className="text-right p-3 font-medium">Miete/Monat</th>
                    <th className="text-right p-3 font-medium">Nebenkosten/Monat</th>
                    <th className="text-right p-3 font-medium">Gesamt/Monat</th>
                    {monthNames.map((month, index) => (
                      <th key={index} className="text-center p-2 font-medium text-xs">
                        {month}
                      </th>
                    ))}
                    <th className="text-right p-3 font-medium">Gesamt</th>
                    <th className="text-right p-3 font-medium">Bezahlt</th>
                    <th className="text-right p-3 font-medium">Offen</th>
                  </tr>
                </thead>
                <tbody>
                  {unitsOverview.map((unitOverview) => (
                    <tr 
                      key={unitOverview.unit.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigateToUnit(unitOverview.unit.id)}
                    >
                      <td className="p-3 font-medium sticky left-0 bg-white">
                        <div>
                          <div className="font-semibold">{unitOverview.unit.name}</div>
                          <div className="text-sm text-gray-500">{unitOverview.unit.type}</div>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(Number(unitOverview.unit.monthlyRent))}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(Number(unitOverview.unit.monthlyUtilities || 0))}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(Number(unitOverview.unit.monthlyRent) + Number(unitOverview.unit.monthlyUtilities || 0))}
                      </td>
                      {unitOverview.monthlyOverview.map((item) => (
                        <td key={item.month} className="p-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation() // Prevent row click
                              togglePaidStatus(unitOverview.unit.id, item.month)
                            }}
                            disabled={isSaving}
                            className={`w-4 h-4 mx-auto rounded-full border-2 flex items-center justify-center transition-colors ${
                              item.isPaid
                                ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                                : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'
                            }`}
                          >
                            {item.isPaid && <Check className="w-3 h-3" />}
                          </button>
                        </td>
                      ))}
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(unitOverview.totals.totalExpected)}
                      </td>
                      <td className="p-3 text-right text-green-600">
                        {formatCurrency(unitOverview.totals.totalPaid)}
                      </td>
                      <td className="p-3 text-right text-red-600">
                        {formatCurrency(unitOverview.totals.totalUnpaid)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {unitsOverview.map((unitOverview) => (
                <div 
                  key={unitOverview.unit.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigateToUnit(unitOverview.unit.id)}
                >
                  {/* Unit Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{unitOverview.unit.name}</h3>
                      <p className="text-sm text-gray-500">{unitOverview.unit.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Gesamt/Monat</p>
                      <p className="font-semibold">
                        {formatCurrency(Number(unitOverview.unit.monthlyRent) + Number(unitOverview.unit.monthlyUtilities || 0))}
                      </p>
                    </div>
                  </div>

                  {/* Monthly Details */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div>
                      <span className="text-gray-600">Miete:</span>
                      <span className="ml-1">{formatCurrency(Number(unitOverview.unit.monthlyRent))}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Nebenkosten:</span>
                      <span className="ml-1">{formatCurrency(Number(unitOverview.unit.monthlyUtilities || 0))}</span>
                    </div>
                  </div>

                  {/* Payment Status Grid */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Zahlungsstatus:</p>
                    <div className="grid grid-cols-6 gap-1">
                      {unitOverview.monthlyOverview.map((item) => (
                        <div key={item.month} className="text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation() // Prevent card click
                              togglePaidStatus(unitOverview.unit.id, item.month)
                            }}
                            disabled={isSaving}
                            className={`w-6 h-6 mx-auto rounded-full border-2 flex items-center justify-center transition-colors ${
                              item.isPaid
                                ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                                : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'
                            }`}
                            title={`${monthNames[item.month - 1]}: ${item.isPaid ? 'Bezahlt' : 'Offen'}`}
                          >
                            {item.isPaid && <Check className="w-4 h-4" />}
                          </button>
                          <p className="text-xs text-gray-500 mt-1">{monthNames[item.month - 1]}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="grid grid-cols-3 gap-2 text-sm border-t pt-3">
                    <div className="text-center">
                      <p className="text-gray-600">Gesamt</p>
                      <p className="font-semibold">{formatCurrency(unitOverview.totals.totalExpected)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Bezahlt</p>
                      <p className="font-semibold text-green-600">{formatCurrency(unitOverview.totals.totalPaid)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Offen</p>
                      <p className="font-semibold text-red-600">{formatCurrency(unitOverview.totals.totalUnpaid)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center">
          <div className="flex gap-4">
            <Link href={`/properties/${propertyId}`}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zum Objekt
              </Button>
            </Link>
            <Link href={`/properties/${propertyId}/units/new`}>
              <Button>
                Neue Einheit hinzufügen
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
