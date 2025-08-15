'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, ArrowLeft, Home } from 'lucide-react'
// Navigation is provided by the root layout

const unitTypes = [
  { value: 'wohnung', label: 'Wohnung' },
  { value: 'garage', label: 'Garage' },
  { value: 'stellplatz', label: 'Stellplatz' },
  { value: 'gewerbe', label: 'Gewerbe' },
  { value: 'keller', label: 'Keller' },
  { value: 'dachboden', label: 'Dachboden' },
  { value: 'garten', label: 'Garten' },
  { value: 'sonstiges', label: 'Sonstiges' }
]

export default function NewUnitPage() {
  const [name, setName] = useState('')
  const [type, setType] = useState('wohnung')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [monthlyUtilities, setMonthlyUtilities] = useState('')
  const [size, setSize] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [property, setProperty] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string

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
      setError('Fehler beim Laden des Objekts')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          type,
          monthlyRent: parseFloat(monthlyRent),
          monthlyUtilities: monthlyUtilities ? parseFloat(monthlyUtilities) : null,
          size,
          description,
          propertyId,
        }),
      })

      if (response.ok) {
        router.push(`/properties/${propertyId}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Fehler beim Erstellen der Einheit')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href={`/properties/${propertyId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zum Objekt
            </Link>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Home className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <CardTitle>Neue Einheit hinzufügen</CardTitle>
                  <CardDescription>
                    {property && `Fügen Sie eine Einheit zu "${property.name}" hinzu`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Einheitsname *
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="z.B. Whg 3. OG rechts, Garage 2"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Typ *
                  </label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {unitTypes.map((unitType) => (
                      <option key={unitType.value} value={unitType.value}>
                        {unitType.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700 mb-2">
                      Monatliche Miete (€) *
                    </label>
                    <Input
                      id="monthlyRent"
                      type="number"
                      step="0.01"
                      min="0"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label htmlFor="monthlyUtilities" className="block text-sm font-medium text-gray-700 mb-2">
                      Nebenkosten (€)
                    </label>
                    <Input
                      id="monthlyUtilities"
                      type="number"
                      step="0.01"
                      min="0"
                      value={monthlyUtilities}
                      onChange={(e) => setMonthlyUtilities(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                    Größe
                  </label>
                  <Input
                    id="size"
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="z.B. 80m², 12m²"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Optionale Beschreibung der Einheit..."
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Erstellen...' : 'Einheit erstellen'}
                  </Button>
                  <Link href={`/properties/${propertyId}`}>
                    <Button type="button" variant="outline">
                      Abbrechen
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
