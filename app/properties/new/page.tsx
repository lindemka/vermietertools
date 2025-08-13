'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, ArrowLeft } from 'lucide-react'
import Navigation from '@/components/navigation'

export default function NewPropertyPage() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [isSimpleMode, setIsSimpleMode] = useState(true)
  const [monthlyRent, setMonthlyRent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          address,
          description,
        }),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Fehler beim Erstellen des Objekts')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zum Dashboard
            </Link>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Building2 className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <CardTitle>Neues Objekt hinzufügen</CardTitle>
                  <CardDescription>
                    Erfassen Sie die Details Ihres Mietobjekts
                  </CardDescription>
                </div>
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
                    placeholder="z.B. Wohnung Hauptstraße 123"
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

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Erstellen...' : 'Objekt erstellen'}
                  </Button>
                  <Link href="/dashboard">
                    <Button type="button" variant="outline" className="w-full sm:w-auto">
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
