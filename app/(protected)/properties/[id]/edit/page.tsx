'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, ArrowLeft, Save, Trash2 } from 'lucide-react'
// Navigation is provided by the root layout

interface Property {
  id: string
  name: string
  address: string
  description?: string
  isActive: boolean
}

export default function EditPropertyPage() {
  const [property, setProperty] = useState<Property | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSimpleMode, setIsSimpleMode] = useState(false)
  const [monthlyRent, setMonthlyRent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
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
        setName(data.name)
        setAddress(data.address)
        setDescription(data.description || '')
        setIsActive(data.isActive)
        
        // Check if this is a simple mode property
        if (data.units && data.units.length === 1 && data.units[0].name === 'Hauptobjekt') {
          setIsSimpleMode(true)
          setMonthlyRent(data.units[0].monthlyRent.toString())
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Objekt nicht gefunden')
      }
    } catch (err) {
      setError('Fehler beim Laden des Objekts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const response = await fetch('/api/properties', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: propertyId,
          name,
          address,
          description,
          isActive,
          isSimpleMode,
          monthlyRent: isSimpleMode ? parseFloat(monthlyRent) : undefined,
        }),
      })

      if (response.ok) {
        router.push(`/properties/${propertyId}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Fehler beim Aktualisieren des Objekts')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Objekt löschen möchten? Alle Einheiten und Mieteinnahmen werden ebenfalls gelöscht.')) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/properties?id=${propertyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Fehler beim Löschen des Objekts')
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
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Laden...</div>
        </div>
      </div>
    )
  }

  if (error && !property) {
    return (
      <div className="min-h-screen bg-gray-50">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building2 className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <CardTitle>Objekt bearbeiten</CardTitle>
                    <CardDescription>
                      Bearbeiten Sie die Details des Objekts
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
                    Objektname *
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="z.B. Musterstraße 12"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <Input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Vollständige Adresse"
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
                    placeholder="Optionale Beschreibung des Objekts..."
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
                    Objekt ist aktiv
                  </label>
                </div>

                {/* Modus-Auswahl */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Objekt-Typ</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        id="simple-mode"
                        type="radio"
                        name="mode"
                        checked={isSimpleMode}
                        onChange={() => setIsSimpleMode(true)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="simple-mode" className="flex-1">
                        <div className="font-medium text-gray-900">Einfach (z.B. Einfamilienhaus)</div>
                        <div className="text-sm text-gray-500">
                          Ein Objekt mit einer einzigen Mieteinnahme. Ideal für Einfamilienhäuser oder einzelne Wohnungen.
                        </div>
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        id="complex-mode"
                        type="radio"
                        name="mode"
                        checked={!isSimpleMode}
                        onChange={() => setIsSimpleMode(false)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="complex-mode" className="flex-1">
                        <div className="font-medium text-gray-900">Mehrere Einheiten (z.B. Mehrfamilienhaus)</div>
                        <div className="text-sm text-gray-500">
                          Ein Objekt mit mehreren vermietbaren Einheiten. Ideal für Mehrfamilienhäuser oder Gewerbeobjekte.
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Monatliche Miete für Einfach-Modus */}
                {isSimpleMode && (
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
                )}

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
