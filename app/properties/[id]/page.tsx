'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Home, Euro, Calendar, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Navigation from '@/components/navigation'
import RentalOverviewEmbed from '@/components/RentalOverviewEmbed'
import PropertyPeopleManager from '@/components/PropertyPeopleManager'

interface Property {
  id: string
  name: string
  address: string
  description?: string
  isActive: boolean
  units: Unit[]
}

interface Unit {
  id: string
  name: string
  type: string
  size?: string
  description?: string
  monthlyRent: number
  monthlyUtilities?: number
  isActive: boolean
  rentals: Rental[]
}

interface Rental {
  id: string
  month: number
  year: number
  rentAmount: number
  utilitiesAmount: number
  isPaid: boolean
  notes?: string
}

const unitTypeLabels: { [key: string]: string } = {
  'apartment': 'Wohnung',
  'house': 'Haus',
  'commercial': 'Gewerbe',
  'garage': 'Garage',
  'storage': 'Lagerraum',
  'parking': 'Parkplatz'
}

export default function PropertyDetailPage() {
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'units' | 'rentals' | 'people'>('rentals')
  const params = useParams()
  const propertyId = params.id as string

  // Function to refresh property people when switching to people tab
  const handleTabChange = (tab: 'units' | 'rentals' | 'people') => {
    setActiveTab(tab);
    if (tab === 'people' && (window as any).refreshPropertyPeople) {
      // Small delay to ensure the component is mounted
      setTimeout(() => {
        (window as any).refreshPropertyPeople();
      }, 100);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchProperty()
    }
  }, [propertyId])

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`)
      if (response.ok) {
        const data = await response.json()
        setProperty(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fehler beim Laden des Objekts')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotalMonthlyRent = () => {
    if (!property) return 0
    return property.units
      .filter(unit => unit.isActive)
      .reduce((sum, unit) => sum + Number(unit.monthlyRent), 0)
  }

  const calculateTotalYearlyRent = () => {
    return calculateTotalMonthlyRent() * 12
  }

  const calculateRentPerSqm = (unit: Unit) => {
    if (!unit.size) return null
    
    // Extract numeric value from size string (e.g., "80m²" -> 80)
    const sizeMatch = unit.size.match(/(\d+(?:\.\d+)?)/)
    if (!sizeMatch) return null
    
    const sizeInSqm = parseFloat(sizeMatch[1])
    if (sizeInSqm <= 0) return null
    
    const totalMonthlyRent = Number(unit.monthlyRent) + Number(unit.monthlyUtilities || 0)
    return totalMonthlyRent / sizeInSqm
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
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            ← Zurück zum Dashboard
          </Link>
        </div>

        {/* Property Header - Minimal */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center">
              <Building2 className="w-5 h-5 text-gray-600 mr-2" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{property.name}</h1>
                <p className="text-sm text-gray-600 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {property.address}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                property.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {property.isActive ? 'Aktiv' : 'Inaktiv'}
              </span>
              <Link href={`/properties/${propertyId}/evaluation`}>
                <Button variant="outline" size="sm">
                  Bewertung
                </Button>
              </Link>
              <Link href={`/properties/${propertyId}/investment-comparison`}>
                <Button variant="outline" size="sm">
                  Investitionsvergleich
                </Button>
              </Link>
              <Link href={`/properties/${propertyId}/edit`}>
                <Button variant="outline" size="sm">
                  Bearbeiten
                </Button>
              </Link>
            </div>
          </div>
          {property.description && (
            <p className="text-sm text-gray-600 mt-3">{property.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('rentals')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rentals'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mieteinnahmen
              </button>
              <button
                onClick={() => handleTabChange('units')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'units'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Einheiten
              </button>
              <button
                onClick={() => handleTabChange('people')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'people'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Personen
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'rentals' && (
          <div>
            <RentalOverviewEmbed propertyId={propertyId} />
          </div>
        )}

        {activeTab === 'units' && (
          <div>
            {/* Units Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Einheiten</h2>
                <p className="text-gray-600">Verwalten Sie die Einheiten in diesem Objekt</p>
              </div>
              <Link href={`/properties/${propertyId}/units/new`}>
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Einheit
                </Button>
              </Link>
            </div>

            {property.units.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Einheiten vorhanden</h3>
                  <p className="text-gray-600 mb-4">Erstellen Sie Ihre erste Einheit, um mit der Verwaltung zu beginnen.</p>
                  <Link href={`/properties/${propertyId}/units/new`}>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Erste Einheit erstellen
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {property.units.map((unit) => (
                  <Card key={unit.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{unit.name}</CardTitle>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          unit.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {unit.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {unit.size && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Größe:</span>
                            <span className="font-medium">{unit.size}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Miete:</span>
                          <span className="font-medium">{formatCurrency(Number(unit.monthlyRent))}</span>
                        </div>
                        {unit.monthlyUtilities && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Nebenkosten:</span>
                            <span className="font-medium">{formatCurrency(Number(unit.monthlyUtilities))}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                          <span>Gesamt:</span>
                          <span>{formatCurrency(Number(unit.monthlyRent) + Number(unit.monthlyUtilities || 0))}</span>
                        </div>
                        {calculateRentPerSqm(unit) && (
                          <div className="flex justify-between text-sm bg-blue-50 p-2 rounded">
                            <span className="text-gray-600 font-medium">Miete/qm:</span>
                            <span className="font-bold text-blue-600">{formatCurrency(calculateRentPerSqm(unit)!)}/m²</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Link href={`/units/${unit.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Details
                          </Button>
                        </Link>
                        <Link href={`/units/${unit.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Bearbeiten
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'people' && (
          <div>
            {/* People Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Personen</h2>
                <p className="text-gray-600">Verwalten Sie die Personen, die diesem Objekt zugeordnet sind</p>
              </div>
            </div>
            
            <PropertyPeopleManager propertyId={propertyId} />
          </div>
        )}
      </div>
    </div>
  )
}
