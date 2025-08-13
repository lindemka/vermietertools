'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, ArrowLeft, Save } from 'lucide-react'
import Navigation from '@/components/navigation'

interface Unit {
  id: string
  name: string
  propertyId: string
}

export default function NewRentalPage() {
  const [unit, setUnit] = useState<Unit | null>(null)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [amount, setAmount] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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
      const response = await fetch(`/api/units?unitId=${unitId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.units && data.units.length > 0) {
          setUnit(data.units[0])
          // Set default amount to unit's monthly rent
          setAmount(data.units[0].monthlyRent.toString())
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
      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month,
          year,
          amount: parseFloat(amount),
          isPaid,
          notes,
          unitId,
        }),
      })

      if (response.ok) {
        router.push(`/units/${unitId}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Fehler beim Erstellen der Mieteinnahme')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsSaving(false)
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
            <Link href={`/units/${unitId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Einheit
            </Link>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <CardTitle>Neue Mieteinnahme</CardTitle>
                  <CardDescription>
                    Fügen Sie eine neue Mieteinnahme für {unit?.name} hinzu
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                      Monat *
                    </label>
                    <select
                      id="month"
                      value={month}
                      onChange={(e) => setMonth(parseInt(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value={1}>Januar</option>
                      <option value={2}>Februar</option>
                      <option value={3}>März</option>
                      <option value={4}>April</option>
                      <option value={5}>Mai</option>
                      <option value={6}>Juni</option>
                      <option value={7}>Juli</option>
                      <option value={8}>August</option>
                      <option value={9}>September</option>
                      <option value={10}>Oktober</option>
                      <option value={11}>November</option>
                      <option value={12}>Dezember</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                      Jahr *
                    </label>
                    <Input
                      id="year"
                      type="number"
                      min="2020"
                      max="2030"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Betrag (€) *
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notizen
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Optionale Notizen zur Mieteinnahme..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="isPaid"
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">
                    Miete ist bereits bezahlt
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
                  <Link href={`/units/${unitId}`}>
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
