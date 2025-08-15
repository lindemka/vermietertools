'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingUp, Home, BarChart3, Calculator, Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
// Navigation is provided by the root layout

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

interface InvestmentComparison {
  propertyValue: number
  annualRent: number
  annualExpenses: number
  annualNetIncome: number
  propertyAppreciation: number
  etfReturn: number
  years: number
  propertyScenario: {
    totalValue: number
    totalIncome: number
    totalReturn: number
    annualizedReturn: number
  }
  etfScenario: {
    totalValue: number
    totalReturn: number
    annualizedReturn: number
  }
}

export default function InvestmentComparisonPage() {
  const [property, setProperty] = useState<Property | null>(null)
  const [comparison, setComparison] = useState<InvestmentComparison | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()
  const propertyId = params.id as string

  // Investment parameters - will be auto-filled from property data
  const [propertyValue, setPropertyValue] = useState(0)
  const [annualRent, setAnnualRent] = useState(0)
  const [annualExpenses, setAnnualExpenses] = useState(0)
  const [propertyAppreciation, setPropertyAppreciation] = useState(2.0)
  const [etfReturn, setEtfReturn] = useState(7.0)
  const [years, setYears] = useState(10)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const saveSettings = useCallback(async () => {
    try {
      const settings = {
        propertyAppreciation,
        etfReturn,
        years
      }
      
      console.log('INVESTMENT: Saving settings for property:', propertyId, settings)
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
        console.log('INVESTMENT: Settings saved successfully:', result)
      } else {
        const errorText = await response.text()
        console.error('INVESTMENT: Settings save error:', errorText)
      }
    } catch (error) {
      console.error('INVESTMENT: Error saving settings:', error)
    }
  }, [propertyAppreciation, etfReturn, years, propertyId])

  useEffect(() => {
    if (propertyId) {
      fetchProperty()
      loadSettings()
    }
  }, [propertyId])

  useEffect(() => {
    if (property) {
      calculateComparison()
    }
  }, [property, propertyValue, annualRent, annualExpenses, propertyAppreciation, etfReturn, years])

  // Save settings when they change (but not during initial load)
  useEffect(() => {
    console.log('INVESTMENT: Save settings useEffect triggered', { propertyId, settingsLoaded, propertyAppreciation, etfReturn, years })
    if (propertyId && settingsLoaded) {
      saveSettings()
    }
  }, [saveSettings, settingsLoaded])

  const loadSettings = async () => {
    try {
      console.log('Loading investment settings for property:', propertyId)
      const response = await fetch(`/api/properties/${propertyId}/settings`, {
        credentials: 'include'
      })
      console.log('Investment settings response status:', response.status)
      
      if (response.ok) {
        const settings = await response.json()
        console.log('Loaded investment settings:', settings)
        setPropertyAppreciation(settings.propertyAppreciation || 2.0)
        setEtfReturn(settings.etfReturn || 7.0)
        setYears(settings.years || 10)
        setSettingsLoaded(true)
        console.log('Investment settings applied to state')
      } else {
        const errorText = await response.text()
        console.error('Investment settings API error:', errorText)
      }
    } catch (error) {
      console.error('Error loading investment settings:', error)
    }
  }



  const fetchProperty = async () => {
    try {
      // Fetch property data
      const propertyResponse = await fetch(`/api/properties/${propertyId}`)
      if (propertyResponse.ok) {
        const propertyData = await propertyResponse.json()
        setProperty(propertyData)
        
        // Calculate annual rent from units
        const totalAnnualRent = propertyData.units.reduce((sum: number, unit: Unit) => {
          return sum + (Number(unit.monthlyRent) + Number(unit.monthlyUtilities || 0)) * 12
        }, 0)
        setAnnualRent(totalAnnualRent)
        
        // Get property value and expenses from evaluation (using saved settings)
        try {
          console.log('INVESTMENT: Fetching evaluation data with saved settings...')
          const evaluationResponse = await fetch(`/api/properties/${propertyId}/evaluation`)
          if (evaluationResponse.ok) {
            const evaluationData = await evaluationResponse.json()
            console.log('INVESTMENT: Evaluation data received:', {
              estimatedValue: evaluationData.estimatedValue,
              grossRentMultiplier: evaluationData.grossRentMultiplier,
              operatingExpenseRatio: evaluationData.operatingExpenseRatio,
              valueAdjustment: evaluationData.valueAdjustment
            })
            if (evaluationData.estimatedValue) {
              setPropertyValue(evaluationData.estimatedValue)
            }
            // Use the operating expense ratio from evaluation settings
            if (evaluationData.operatingExpenseRatio !== undefined) {
              const calculatedExpenses = totalAnnualRent * (evaluationData.operatingExpenseRatio / 100)
              setAnnualExpenses(calculatedExpenses)
              console.log('INVESTMENT: Set annual expenses based on evaluation settings:', {
                operatingExpenseRatio: evaluationData.operatingExpenseRatio,
                calculatedExpenses
              })
            }
          }
        } catch (evaluationErr) {
          // If evaluation fails, use a default calculation
          console.log('INVESTMENT: Could not fetch evaluation data, using default calculation')
          // Estimate property value as 12x annual rent (default GRM)
          setPropertyValue(totalAnnualRent * 12)
          // Use default operating expense ratio of 25%
          setAnnualExpenses(totalAnnualRent * 0.25)
        }
      } else {
        const errorData = await propertyResponse.json()
        setError(errorData.error || 'Fehler beim Laden des Objekts')
      }
    } catch (err) {
      setError('Fehler beim Laden des Objekts')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateComparison = () => {
    if (!property) return

    const annualNetIncome = annualRent - annualExpenses
    const propertyAppreciationRate = propertyAppreciation / 100
    const etfReturnRate = etfReturn / 100

    // Property scenario calculations
    let propertyTotalValue = propertyValue
    let propertyTotalIncome = 0

    for (let year = 1; year <= years; year++) {
      propertyTotalValue *= (1 + propertyAppreciationRate)
      propertyTotalIncome += annualNetIncome
    }

    const propertyTotalReturn = propertyTotalValue + propertyTotalIncome - propertyValue
    const propertyAnnualizedReturn = Math.pow((propertyTotalValue + propertyTotalIncome) / propertyValue, 1/years) - 1

    // ETF scenario calculations
    const etfTotalValue = propertyValue * Math.pow(1 + etfReturnRate, years)
    const etfTotalReturn = etfTotalValue - propertyValue
    const etfAnnualizedReturn = etfReturnRate

    setComparison({
      propertyValue,
      annualRent,
      annualExpenses,
      annualNetIncome,
      propertyAppreciation,
      etfReturn,
      years,
      propertyScenario: {
        totalValue: propertyTotalValue,
        totalIncome: propertyTotalIncome,
        totalReturn: propertyTotalReturn,
        annualizedReturn: propertyAnnualizedReturn * 100
      },
      etfScenario: {
        totalValue: etfTotalValue,
        totalReturn: etfTotalReturn,
        annualizedReturn: etfAnnualizedReturn * 100
      }
    })
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

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href={`/properties/${propertyId}`} 
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zum Objekt
            </Link>
            <Link 
              href={`/properties/${propertyId}/evaluation`} 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Bewertung
            </Link>
          </div>
          <div className="flex items-center">
            <BarChart3 className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Investitionsvergleich</h1>
              <p className="text-gray-600">{property.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parameters */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Parameter
                </CardTitle>
                <CardDescription>
                  Passen Sie die Annahmen für den Vergleich an
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Data Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Objektwert:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(propertyValue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Jährliche Miete:</span>
                    <span className="font-bold text-green-600">{formatCurrency(annualRent)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Jährliche Kosten:</span>
                    <span className="font-bold text-orange-600">{formatCurrency(annualExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Nettoeinnahmen:</span>
                    <span className="font-bold text-purple-600">{formatCurrency(annualRent - annualExpenses)}</span>
                  </div>
                </div>

                {/* Note about evaluation settings */}
                <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-xs text-gray-600 mb-2">
                    <strong>Hinweis:</strong> Objektwert und jährliche Kosten werden aus den gespeicherten Bewertungseinstellungen übernommen 
                    (Mietmultiplikator, Betriebskosten, Marktanpassung).
                  </p>
                  <Link 
                    href={`/properties/${propertyId}/evaluation`}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Bewertungseinstellungen anpassen →
                  </Link>
                </div>

                {/* Key Parameters */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Annahmen anpassen:</h4>
                  
                  {/* Property Appreciation */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Immobilien-Wertsteigerung (%)</label>
                      <span className="text-sm text-gray-600">{propertyAppreciation}%</span>
                    </div>
                    <input
                      type="range"
                      value={propertyAppreciation}
                      onChange={(e) => setPropertyAppreciation(parseFloat(e.target.value))}
                      max={5}
                      min={-2}
                      step={0.1}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Jährliche Wertsteigerung der Immobilie
                    </p>
                  </div>

                  {/* ETF Return */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">ETF-Rendite (%)</label>
                      <span className="text-sm text-gray-600">{etfReturn}%</span>
                    </div>
                    <input
                      type="range"
                      value={etfReturn}
                      onChange={(e) => setEtfReturn(parseFloat(e.target.value))}
                      max={12}
                      min={3}
                      step={0.1}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Jährliche Rendite MSCI World ETF
                    </p>
                  </div>

                  {/* Time Period */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Zeitraum (Jahre)</label>
                      <span className="text-sm text-gray-600">{years}</span>
                    </div>
                    <input
                      type="range"
                      value={years}
                      onChange={(e) => setYears(parseInt(e.target.value))}
                      max={30}
                      min={5}
                      step={1}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Vergleichszeitraum
                    </p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <strong>Hinweis:</strong> Objektwert wird aus der Bewertung übernommen, Mieteinnahmen und Kosten aus Ihren Eigenschaftsdaten.
                  <br />
                  <strong>ETF-Szenario:</strong> Nur der Objektwert wird in ETFs investiert (ohne Mieteinnahmen).
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
                  Vergleichsergebnis
                </CardTitle>
                <CardDescription>
                  Halten & Vermieten vs. Verkaufen & ETF-Investieren
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparison ? (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Property Scenario */}
                      <Card className="border-2 border-blue-200 bg-blue-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center">
                            <Home className="w-5 h-5 mr-2 text-blue-600" />
                            Halten & Vermieten
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Immobilienwert:</span>
                            <span className="font-medium">{formatCurrency(comparison.propertyScenario.totalValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Mieteinnahmen:</span>
                            <span className="font-medium">{formatCurrency(comparison.propertyScenario.totalIncome)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Gesamtwert:</span>
                            <span className="text-blue-600">{formatCurrency(comparison.propertyScenario.totalValue + comparison.propertyScenario.totalIncome)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Gesamtrendite:</span>
                            <span className="font-medium text-green-600">{formatCurrency(comparison.propertyScenario.totalReturn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Jährliche Rendite:</span>
                            <span className="font-medium">{comparison.propertyScenario.annualizedReturn.toFixed(1)}%</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* ETF Scenario */}
                      <Card className="border-2 border-green-200 bg-green-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                            Verkaufen & ETF
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Investiertes Kapital:</span>
                            <span className="font-medium">{formatCurrency(propertyValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">ETF-Wert nach {years} Jahren:</span>
                            <span className="font-medium">{formatCurrency(comparison.etfScenario.totalValue)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Gesamtwert:</span>
                            <span className="text-green-600">{formatCurrency(comparison.etfScenario.totalValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Gesamtrendite:</span>
                            <span className="font-medium text-green-600">{formatCurrency(comparison.etfScenario.totalReturn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Jährliche Rendite:</span>
                            <span className="font-medium">{comparison.etfScenario.annualizedReturn.toFixed(1)}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Comparison */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Vergleich</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">Bessere Option:</span>
                            <span className={`font-bold text-lg ${
                              (comparison.propertyScenario.totalValue + comparison.propertyScenario.totalIncome) > comparison.etfScenario.totalValue
                                ? 'text-blue-600'
                                : 'text-green-600'
                            }`}>
                              {(comparison.propertyScenario.totalValue + comparison.propertyScenario.totalIncome) > comparison.etfScenario.totalValue
                                ? 'Halten & Vermieten'
                                : 'Verkaufen & ETF'
                              }
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">Differenz:</span>
                            <span className={`font-bold ${
                              Math.abs((comparison.propertyScenario.totalValue + comparison.propertyScenario.totalIncome) - comparison.etfScenario.totalValue) > 0
                                ? 'text-blue-600'
                                : 'text-gray-600'
                            }`}>
                              {formatCurrency(Math.abs((comparison.propertyScenario.totalValue + comparison.propertyScenario.totalIncome) - comparison.etfScenario.totalValue))}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Disclaimer */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Hinweis:</strong> Diese Berechnung ist eine vereinfachte Simulation. 
                        <br />
                        <strong>Immobilie:</strong> Wertsteigerung + Mieteinnahmen - Betriebskosten
                        <br />
                        <strong>ETF:</strong> Nur Objektwert wird investiert (ohne Mieteinnahmen)
                        <br />
                        Realistische Faktoren wie Steuern, Transaktionskosten, Leerstände, 
                        Marktvolatilität und individuelle Umstände wurden nicht berücksichtigt. 
                        Konsultieren Sie einen Finanzberater für eine detaillierte Analyse.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Berechne Vergleich...</p>
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
