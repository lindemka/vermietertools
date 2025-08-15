'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Euro, Plus, TrendingUp, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
// Navigation is injected by the root layout

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
  monthlyRent: number
  size?: string
  description?: string
  isActive: boolean
  rentals: Rental[]
}

interface Rental {
  id: string
  month: number
  year: number
  amount: number
  isPaid: boolean
}

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties)
      } else {
        setError('Fehler beim Laden der Objekte')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateMonthlyIncome = () => {
    return properties
      .filter(p => p.isActive)
      .flatMap(property => property.units)
      .filter(unit => unit.isActive)
      .reduce((sum, unit) => sum + Number(unit.monthlyRent), 0)
  }

  const calculateYearlyIncome = () => {
    return calculateMonthlyIncome() * 12
  }

  const getCurrentMonthRentals = () => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    
    return properties.flatMap(property => 
      (property.units || []).flatMap(unit => 
        (unit.rentals || []).filter(rental => 
          rental.month === currentMonth && rental.year === currentYear
        )
      )
    )
  }

  const currentMonthRentals = getCurrentMonthRentals()
  const paidThisMonth = currentMonthRentals.filter(r => r.isPaid).length
  const totalThisMonth = currentMonthRentals.length

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Laden...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive Objekte</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {properties.filter(p => p.isActive).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monatliche Mieteinnahmen</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(calculateMonthlyIncome())}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jährliche Mieteinnahmen</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(calculateYearlyIncome())}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dieser Monat bezahlt</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paidThisMonth}/{totalThisMonth}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties List */}
                  <Card>
            <CardHeader>
              <CardTitle>Ihre Objekte</CardTitle>
              <CardDescription>
                Übersicht aller Ihrer Mietobjekte
              </CardDescription>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">Noch keine Objekte vorhanden</p>
                  <Link href="/properties/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Erstes Objekt hinzufügen
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Existing Property Cards */}
                  {properties.map((property) => {
                    const units = property.units || []
                    const totalMonthlyRent = units
                      .filter(unit => unit.isActive)
                      .reduce((sum, unit) => sum + Number(unit.monthlyRent), 0)
                    
                    return (
                      <Link key={property.id} href={`/properties/${property.id}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                          <div className="relative">
                            <img
                              src={property.name.includes('München') 
                                ? "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=250&fit=crop&crop=center"
                                : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop&crop=center"
                              }
                              alt={`${property.name} - Gebäude`}
                              className="w-full h-48 object-cover rounded-t-lg group-hover:brightness-105 transition-all"
                            />
                            <div className="absolute top-3 right-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                property.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {property.isActive ? 'Aktiv' : 'Inaktiv'}
                              </span>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                                {property.name}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {property.address}
                              </p>
                              <div className="flex items-center justify-between pt-2">
                                <div className="text-sm text-gray-500">
                                  <Building2 className="w-4 h-4 inline mr-1" />
                                  {units.length} Einheit{units.length !== 1 ? 'en' : ''}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-blue-600">
                                    {formatCurrency(totalMonthlyRent)}
                                  </p>
                                  <p className="text-xs text-gray-500">pro Monat</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}

                  {/* New Property Card */}
                  <Link href="/properties/new">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50">
                      <div className="relative h-48 flex items-center justify-center">
                        <div className="text-center">
                          <Plus className="w-16 h-16 mx-auto text-gray-400 group-hover:text-blue-500 transition-colors mb-4" />
                          <h3 className="font-semibold text-lg text-gray-600 group-hover:text-blue-600 transition-colors">
                            Neues Objekt
                          </h3>
                          <p className="text-sm text-gray-500 mt-2">
                            Neues Mietobjekt hinzufügen
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
