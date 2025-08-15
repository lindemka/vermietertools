'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, Plus, Edit, Trash2, Euro, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
// Navigation is provided by the root layout

interface Unit {
  id: string
  name: string
  type: string
  monthlyRent: number
  size?: string
  description?: string
  isActive: boolean
  propertyId: string
  rentals: Rental[]
}

interface Rental {
  id: string
  month: number
  year: number
  amount: number
  isPaid: boolean
  notes?: string
}

const unitTypeLabels: { [key: string]: string } = {
  wohnung: 'Wohnung',
  garage: 'Garage',
  stellplatz: 'Stellplatz',
  gewerbe: 'Gewerbe',
  keller: 'Keller',
  dachboden: 'Dachboden',
  garten: 'Garten',
  sonstiges: 'Sonstiges'
}

const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

export default function UnitDetailPage() {
  const [unit, setUnit] = useState<Unit | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const params = useParams()
  const router = useRouter()
  const unitId = params.id as string

  useEffect(() => {
    if (unitId) {
      // Redirect to yearly overview as main view
      router.push(`/units/${unitId}/yearly-overview`)
    }
  }, [unitId, router])

  const fetchUnit = async () => {
    try {
      const response = await fetch(`/api/units?unitId=${unitId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.units && data.units.length > 0) {
          setUnit(data.units[0])
        } else {
          setError('Einheit nicht gefunden')
        }
      } else {
        setError('Einheit nicht gefunden')
      }
    } catch (err) {
      setError('Fehler beim Laden der Einheit')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Sind Sie sicher, dass Sie diese Einheit löschen möchten? Alle Mieteinnahmen werden ebenfalls gelöscht.')) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/units?id=${unitId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push(`/properties/${unit?.propertyId}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Fehler beim Löschen der Einheit')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsDeleting(false)
    }
  }

  const calculateTotalRentals = () => {
    if (!unit) return 0
    return unit.rentals.reduce((sum, rental) => sum + Number(rental.amount), 0)
  }

  const calculatePaidRentals = () => {
    if (!unit) return 0
    return unit.rentals
      .filter(rental => rental.isPaid)
      .reduce((sum, rental) => sum + Number(rental.amount), 0)
  }

  const calculateUnpaidRentals = () => {
    return calculateTotalRentals() - calculatePaidRentals()
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/properties/${unit.propertyId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Objekt
          </Link>
        </div>

        {/* Unit Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Home className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <CardTitle className="text-2xl">{unit.name}</CardTitle>
                  <CardDescription>
                    {unitTypeLabels[unit.type] || unit.type}
                    {unit.size && ` • ${unit.size}`}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right mr-4">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium ${unit.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {unit.isActive ? 'Aktiv' : 'Inaktiv'}
                  </p>
                </div>
                <Link href={`/units/${unitId}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Bearbeiten
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Löschen...' : 'Löschen'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Euro className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                <p className="text-sm text-gray-600">Monatliche Miete</p>
                <p className="text-xl font-bold">{formatCurrency(Number(unit.monthlyRent))}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Calendar className="w-6 h-6 mx-auto text-green-600 mb-2" />
                <p className="text-sm text-gray-600">Mieteinnahmen</p>
                <p className="text-xl font-bold">{unit.rentals.length}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Euro className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                <p className="text-sm text-gray-600">Gesamt</p>
                <p className="text-xl font-bold">{formatCurrency(calculateTotalRentals())}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Euro className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                <p className="text-sm text-gray-600">Offen</p>
                <p className="text-xl font-bold">{formatCurrency(calculateUnpaidRentals())}</p>
              </div>
            </div>
            {unit.description && (
              <p className="text-gray-600">{unit.description}</p>
            )}
          </CardContent>
        </Card>

        {/* This page now redirects to yearly overview */}
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <p className="text-gray-500 mb-4">Weiterleitung zur Jahresübersicht...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
