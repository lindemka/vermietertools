'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Home, ArrowLeft, Save, Trash2 } from 'lucide-react'
import Navigation from '@/components/navigation'

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

interface Unit {
  id: string
  name: string
  type: string
  monthlyRent: number
  size?: string
  description?: string
  isActive: boolean
  propertyId: string
}

export default function EditUnitPage() {
  const [unit, setUnit] = useState<Unit | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState('wohnung')
  const [size, setSize] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const unitId = params.id as string

  useEffect(() => {
    if (unitId) {
      fetchUnit()
    }
  }, [unitId])

  const fetchUnit = async () => {
    try {
      // We need to get the unit from the property API since we don't have a single unit API
      const response = await fetch(`/api/units?unitId=${unitId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.units && data.units.length > 0) {
          const unitData = data.units[0]
          setUnit(unitData)
          setName(unitData.name)
          setType(unitData.type)
          setSize(unitData.size || '')
          setDescription(unitData.description || '')
          setIsActive(unitData.isActive)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const response = await fetch('/api/units', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: unitId,
          name,
          type,
          size,
          description,
          isActive,
        }),
      })

      if (response.ok) {
        router.push(`/properties/${unit?.propertyId}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Fehler beim Aktualisieren der Einheit')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsSaving(false)
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

  if (error && !unit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">{error}</div>
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
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href={`/properties/${unit?.propertyId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zum Objekt
            </Link>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Home className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <CardTitle>Einheit bearbeiten</CardTitle>
                    <CardDescription>
                      Bearbeiten Sie die Details der Einheit
                    </CardDescription>
                  </div>
                </div>
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

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Miete und Nebenkosten
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          Die Standard-Miete und Nebenkosten können Sie in der Jahresübersicht bearbeiten. 
                          Dort können Sie auch Mietübergänge und Leerstände verwalten.
                        </p>
                      </div>
                    </div>
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

                <div className="flex items-center space-x-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Einheit ist aktiv
                  </label>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSaving} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Speichern...' : 'Speichern'}
                  </Button>
                  <Link href={`/properties/${unit?.propertyId}`}>
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
