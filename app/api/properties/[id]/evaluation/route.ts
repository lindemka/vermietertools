import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user session
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const property = await prisma.property.findFirst({
      where: { 
        id: params.id,
        userId: session.userId
      },
      include: {
        units: {
          include: {
            rentals: {
              orderBy: [
                { year: 'desc' },
                { month: 'desc' }
              ]
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Objekt nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    // Calculate basic evaluation data
    const totalMonthlyRent = property.units.reduce((sum, unit) => {
      const rent = Number(unit.monthlyRent) || 0
      const utilities = Number(unit.monthlyUtilities) || 0
      return sum + rent + utilities
    }, 0)

    const totalYearlyRent = totalMonthlyRent * 12
    
    // Load saved evaluation settings or use defaults
    const settings = await prisma.propertySettings.findUnique({
      where: { propertyId: params.id }
    })
    
    const grossRentMultiplier = settings?.grossRentMultiplier || 12
    const operatingExpenseRatio = settings?.operatingExpenseRatio || 25
    const valueAdjustment = settings?.valueAdjustment || 0

    // Calculate estimated value using GRM method with saved settings
    const estimatedValue = totalYearlyRent * grossRentMultiplier * (1 + valueAdjustment / 100)
    
    // Calculate the resulting cap rate from the GRM method
    const netOperatingIncome = totalYearlyRent * (1 - operatingExpenseRatio / 100)
    const calculatedCapRate = (netOperatingIncome / estimatedValue) * 100

    return NextResponse.json({
      property,
      estimatedValue,
      totalYearlyRent,
      grossRentMultiplier,
      operatingExpenseRatio,
      capRate: calculatedCapRate,
      valueAdjustment
    })
  } catch (error) {
    console.error('Error fetching property evaluation:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Bewertungsdaten' },
      { status: 500 }
    )
  }
}
