'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Euro, Check, X, ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Property {
  id: string
  name: string
  address: string
}

interface Unit {
  id: string
  name: string
  monthlyRent: number
  monthlyUtilities?: number
}

interface MonthlyOverview {
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
  monthlyOverview: MonthlyOverview[]
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

interface RentalOverviewEmbedProps {
  propertyId: string
}

export default function RentalOverviewEmbed({ propertyId }: RentalOverviewEmbedProps) {
  const [property, setProperty] = useState<Property | null>(null)
  const [unitsOverview, setUnitsOverview] = useState<UnitOverview[]>([])
  const [propertyTotals, setPropertyTotals] = useState<PropertyTotals | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

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
      <div className="text-center py-8">
        <div className="text-lg">Laden...</div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-red-600">{error || 'Objekt nicht gefunden'}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      {/* Property Totals */}
      {propertyTotals && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          </CardContent>
        </Card>
      )}

      {/* Units Overview */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle>Einheiten-Übersicht {year}</CardTitle>
              <CardDescription>
                Klicken Sie auf die Monatskreise um den Zahlungsstatus zu ändern. 
                Klicken Sie auf eine Einheiten-Zeile um zur Einheiten-Detailseite zu navigieren.
              </CardDescription>
            </div>
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
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Einheit</th>
                  <th className="text-left p-3 font-medium">Miete/Monat</th>
                  <th className="text-left p-3 font-medium">Gesamt/Monat</th>
                  {monthNames.map((month, index) => (
                    <th key={index} className="text-center p-2 font-medium text-sm">
                      {month}
                    </th>
                  ))}
                  <th className="text-left p-3 font-medium">Jahr {year}</th>
                </tr>
              </thead>
              <tbody>
                {unitsOverview.map((unitOverview) => (
                  <tr 
                    key={unitOverview.unit.id} 
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigateToUnit(unitOverview.unit.id)}
                  >
                    <td className="p-3 font-medium">
                      {unitOverview.unit.name}
                    </td>
                    <td className="p-3">
                      {formatCurrency(Number(unitOverview.unit.monthlyRent))}
                    </td>
                    <td className="p-3 font-semibold">
                      {formatCurrency(Number(unitOverview.unit.monthlyRent) + Number(unitOverview.unit.monthlyUtilities || 0))}
                    </td>
                    {monthNames.map((_, index) => {
                      const monthData = unitOverview.monthlyOverview.find(m => m.month === index + 1)
                      return (
                        <td key={index} className="p-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              togglePaidStatus(unitOverview.unit.id, index + 1)
                            }}
                            disabled={isSaving}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              monthData?.isPaid
                                ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                                : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'
                            }`}
                          >
                            {monthData?.isPaid && <Check className="w-3 h-3" />}
                          </button>
                        </td>
                      )
                    })}
                    <td className="p-3 font-semibold">
                      {formatCurrency(unitOverview.totals.totalPaid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {unitsOverview.map((unitOverview) => (
              <div 
                key={unitOverview.unit.id} 
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigateToUnit(unitOverview.unit.id)}
              >
                {/* Unit Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{unitOverview.unit.name}</h3>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(Number(unitOverview.unit.monthlyRent))} + {formatCurrency(Number(unitOverview.unit.monthlyUtilities || 0))} = {formatCurrency(Number(unitOverview.unit.monthlyRent) + Number(unitOverview.unit.monthlyUtilities || 0))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Jahr {year}</p>
                    <p className="font-semibold">
                      {formatCurrency(unitOverview.totals.totalPaid)}
                    </p>
                  </div>
                </div>

                {/* Payment Status Grid */}
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {monthNames.map((month, index) => {
                    const monthData = unitOverview.monthlyOverview.find(m => m.month === index + 1)
                    return (
                      <div key={index} className="text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePaidStatus(unitOverview.unit.id, index + 1)
                          }}
                          disabled={isSaving}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                            monthData?.isPaid
                              ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                              : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'
                          }`}
                          title={`${month} ${year}`}
                        >
                          {monthData?.isPaid && <Check className="w-4 h-4" />}
                        </button>
                        <p className="text-xs text-gray-500 mt-1">{month}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
