'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Calculator, TrendingUp, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Navigation from '@/components/navigation'
import { formatCurrency } from '@/lib/utils'

interface Property {
  id: string
  name: string
  address: string
  isActive: boolean
  description?: string
  units: Unit[]
}

interface Unit {
  id: string
  name: string
  monthlyRent: any
  monthlyUtilities?: any
  isActive: boolean
}

interface EvaluationResult {
  totalMonthlyRent: number
  totalYearlyRent: number
  grossRentMultiplier: number
  netOperatingIncome: number
  capRate: number
  estimatedValue: number
  valueRange: {
    min: number
    max: number
  }
}

export default function PropertyEvaluation() {
  const params = useParams()
  const propertyId = params.id as string

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)

  // Evaluation factors
  const [evaluationMethod, setEvaluationMethod] = useState<'grm'>('grm')
  const [grossRentMultiplier, setGrossRentMultiplier] = useState(12)
  const [operatingExpenseRatio, setOperatingExpenseRatio] = useState(25)
  const [valueAdjustment, setValueAdjustment] = useState(0)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const saveSettings = useCallback(async () => {
    try {
      const settings = {
        grossRentMultiplier,
        operatingExpenseRatio,
        valueAdjustment
      }
      
      console.log('EVALUATION: Saving settings for property:', propertyId, settings)
      const response = await fetch(`/api/properties/${propertyId}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('EVALUATION: Settings saved successfully:', result)
      } else {
        const errorText = await response.text()
        console.error('EVALUATION: Settings save error:', errorText)
      }
    } catch (error) {
      console.error('EVALUATION: Error saving settings:', error)
    }
  }, [grossRentMultiplier, operatingExpenseRatio, valueAdjustment, propertyId])

  useEffect(() => {
    fetchProperty()
    loadSettings()
  }, [propertyId])

  useEffect(() => {
    if (property && property.units && property.units.length > 0) {
      calculateEvaluation()
    }
  }, [property, evaluationMethod, grossRentMultiplier, operatingExpenseRatio, valueAdjustment])

  // Save settings when they change (but not during initial load)
  useEffect(() => {
    console.log('EVALUATION: Save settings useEffect triggered', { propertyId, settingsLoaded, grossRentMultiplier, operatingExpenseRatio, valueAdjustment })
    if (propertyId && settingsLoaded) {
      saveSettings()
    }
  }, [saveSettings, settingsLoaded])

  const loadSettings = async () => {
    try {
      console.log('EVALUATION: Loading settings for property:', propertyId)
      const response = await fetch(`/api/properties/${propertyId}/settings`, {
        credentials: 'include'
      })
      console.log('EVALUATION: Settings response status:', response.status)
      
      if (response.ok) {
        const settings = await response.json()
        console.log('EVALUATION: Loaded settings:', settings)
        setGrossRentMultiplier(settings.grossRentMultiplier || 12)
        setOperatingExpenseRatio(settings.operatingExpenseRatio || 25)
        setValueAdjustment(settings.valueAdjustment || 0)
        setSettingsLoaded(true)
        console.log('EVALUATION: Settings applied to state')
      } else {
        const errorText = await response.text()
        console.error('EVALUATION: Settings API error:', errorText)
      }
    } catch (error) {
      console.error('EVALUATION: Error loading settings:', error)
    }
  }

  const fetchProperty = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching property:', propertyId)
      
      const response = await fetch(`/api/properties/${propertyId}`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Property data:', data)
        console.log('Property units:', data.units)
        console.log('Units length:', data.units?.length)
        setProperty(data)
      } else {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        setError('Objekt konnte nicht geladen werden')
      }
    } catch (error) {
      console.error('Error fetching property:', error)
      setError('Fehler beim Laden des Objekts')
    } finally {
      setLoading(false)
    }
  }

  const calculateEvaluation = () => {
    if (!property || !property.units || property.units.length === 0) {
      console.log('No property or units available for calculation')
      return
    }

    console.log('Calculating evaluation for property:', property.name)
    console.log('Units:', property.units)

    const totalMonthlyRent = property.units.reduce((sum, unit) => {
      const rent = Number(unit.monthlyRent) || 0
      const utilities = Number(unit.monthlyUtilities) || 0
      console.log(`Unit ${unit.name}: rent=${rent}, utilities=${utilities}`)
      return sum + rent + utilities
    }, 0)

    console.log('Total monthly rent:', totalMonthlyRent)

    const totalYearlyRent = totalMonthlyRent * 12
    const grm = grossRentMultiplier
    const oer = operatingExpenseRatio / 100
    const adjustment = valueAdjustment / 100

    // Calculate Net Operating Income (NOI)
    const netOperatingIncome = totalYearlyRent * (1 - oer)

    // Calculate estimated value using GRM method
    const estimatedValue = totalYearlyRent * grm
    
    // Calculate the resulting cap rate from the GRM method
    const calculatedCapRate = (netOperatingIncome / estimatedValue) * 100

    // Apply adjustment factor
    const adjustedValue = estimatedValue * (1 + adjustment)

    // Value range (±10%)
    const valueRange = {
      min: adjustedValue * 0.9,
      max: adjustedValue * 1.1
    }

    const result = {
      totalMonthlyRent,
      totalYearlyRent,
      grossRentMultiplier: grm,
      netOperatingIncome,
      capRate: calculatedCapRate,
      estimatedValue: adjustedValue,
      valueRange
    }

    console.log('Evaluation result:', result)
    setEvaluation(result)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Fehler</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/dashboard">
              <Button>Zurück zum Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Objekt nicht gefunden</h1>
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href={`/properties/${propertyId}`} 
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
              onClick={() => console.log('Navigating to property:', propertyId)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zum Objekt
            </Link>
            <Link 
              href={`/properties/${propertyId}/investment-comparison`} 
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Investitionsvergleich
            </Link>
          </div>
          <div className="flex items-center">
            <Building2 className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Immobilienbewertung</h1>
              <p className="text-gray-600">{property.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evaluation Factors */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Bewertungsfaktoren
                </CardTitle>
                <CardDescription>
                  Passen Sie die Faktoren an Ihre Marktkenntnisse an
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Evaluation Method */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Bewertungsmethode</label>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="evaluationMethod"
                        value="grm"
                        checked={evaluationMethod === 'grm'}
                        onChange={(e) => setEvaluationMethod(e.target.value as 'grm')}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Mietmultiplikator (Bruttomiete)</span>
                    </div>
                  </div>
                </div>

                {/* Gross Rent Multiplier - Only show when GRM method is selected */}
                {evaluationMethod === 'grm' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Mietmultiplikator</label>
                        <div className="group relative">
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity w-64 z-10 pointer-events-none">
                            <p>Wie oft die Bruttomiete im Objektwert enthalten ist. Grobe Kennzahl ohne Betriebskosten. Höhere Werte = höherer Objektwert.</p>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">{grossRentMultiplier}x</span>
                    </div>
                    <input
                      type="range"
                      value={grossRentMultiplier}
                      onChange={(e) => setGrossRentMultiplier(parseFloat(e.target.value))}
                      max={20}
                      min={8}
                      step={0.5}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Typisch: 10-15x für Wohnimmobilien
                    </p>
                  </div>
                )}



                {/* Operating Expense Ratio */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Betriebskosten</label>
                      <div className="group relative">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity w-64 z-10 pointer-events-none">
                          <p>Anteil der Bruttomiete, der für Verwaltung, Instandhaltung, Versicherung etc. anfällt.</p>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">{operatingExpenseRatio}%</span>
                  </div>
                  <input
                    type="range"
                    value={operatingExpenseRatio}
                    onChange={(e) => setOperatingExpenseRatio(parseInt(e.target.value))}
                    max={40}
                    min={15}
                    step={1}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Typisch: 20-30% der Bruttomiete
                  </p>
                </div>

                {/* Value Adjustment */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Marktanpassung</label>
                      <div className="group relative">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity w-64 z-10 pointer-events-none">
                          <p>Anpassung für besondere Marktbedingungen oder Objekteigenschaften (Lage, Zustand, etc.).</p>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">{valueAdjustment > 0 ? '+' : ''}{valueAdjustment}%</span>
                  </div>
                  <input
                    type="range"
                    value={valueAdjustment}
                    onChange={(e) => setValueAdjustment(parseInt(e.target.value))}
                    max={20}
                    min={-20}
                    step={1}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Markt- oder objektspezifische Anpassung
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Bewertungsergebnis
                </CardTitle>
                <CardDescription>
                  Geschätzte Werte basierend auf Ihren Faktoren
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!property.units || property.units.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Keine Einheiten für dieses Objekt vorhanden.</p>
                    <p className="text-sm text-gray-500">Fügen Sie Einheiten hinzu, um eine Bewertung zu erhalten.</p>
                  </div>
                ) : evaluation ? (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Monatliche Miete</p>
                        <p className="text-lg font-bold text-blue-600">{formatCurrency(evaluation.totalMonthlyRent)}</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Jährliche Miete</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(evaluation.totalYearlyRent)}</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <p className="text-sm text-gray-600">Nettoeinnahmen</p>
                          <div className="group relative">
                            <Info className="w-3 h-3 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity w-48 z-10">
                              <p>Jährliche Miete minus Betriebskosten</p>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-purple-600">{formatCurrency(evaluation.netOperatingIncome)}</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <p className="text-sm text-gray-600">Berechnete Rendite</p>
                          <div className="group relative">
                            <Info className="w-3 h-3 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity w-48 z-10 pointer-events-none">
                              <p>Rendite die sich aus dem gewählten Mietmultiplikator ergibt</p>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-orange-600">{evaluation.capRate.toFixed(1)}%</p>
                      </div>
                    </div>



                    {/* Estimated Value */}
                    <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
                      <p className="text-sm text-gray-600 mb-2">Geschätzter Objektwert</p>
                      <p className="text-3xl font-bold text-blue-600 mb-2">{formatCurrency(evaluation.estimatedValue)}</p>
                      <p className="text-sm text-gray-600">
                        Wertebereich: {formatCurrency(evaluation.valueRange.min)} - {formatCurrency(evaluation.valueRange.max)}
                      </p>
                    </div>

                    {/* Calculation Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Info className="w-4 h-4 mr-2" />
                        Berechnungsdetails
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Bruttomiete (jährlich):</span>
                          <span>{formatCurrency(evaluation.totalYearlyRent)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Betriebskosten ({operatingExpenseRatio}%):</span>
                          <span>-{formatCurrency(evaluation.totalYearlyRent * (operatingExpenseRatio / 100))}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <span>Nettoeinnahmen (NOI):</span>
                          <span>{formatCurrency(evaluation.netOperatingIncome)}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Anpassung ({valueAdjustment > 0 ? '+' : ''}{valueAdjustment}%):</span>
                          <span>{valueAdjustment > 0 ? '+' : ''}{formatCurrency(evaluation.estimatedValue * (valueAdjustment / 100))}</span>
                        </div>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Hinweis:</strong> Diese Bewertung ist eine grobe Schätzung basierend auf Mieteinnahmen. 
                        Für eine professionelle Bewertung sollten Sie einen Gutachter beauftragen. 
                        Marktbedingungen, Objektzustand und weitere Faktoren können den tatsächlichen Wert erheblich beeinflussen.
                      </p>
                    </div>

                    {/* Investment Comparison Note */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 mb-2">
                        <strong>Nächster Schritt:</strong> Vergleichen Sie diese Bewertung mit einer ETF-Investition im Investitionsvergleich.
                      </p>
                      <Link 
                        href={`/properties/${propertyId}/investment-comparison`}
                        className="text-sm text-green-700 hover:text-green-900 underline font-medium"
                      >
                        Zum Investitionsvergleich →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Berechne Bewertung...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
