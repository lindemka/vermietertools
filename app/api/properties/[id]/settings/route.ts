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

    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: { 
        id: params.id,
        userId: session.userId
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Objekt nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    // Load settings from database
    const settings = await prisma.propertySettings.findUnique({
      where: { propertyId: params.id }
    })

    // Return settings or defaults
    const result = {
      grossRentMultiplier: settings?.grossRentMultiplier || 12,
      operatingExpenseRatio: settings?.operatingExpenseRatio || 25,
      valueAdjustment: settings?.valueAdjustment || 0,
      propertyAppreciation: settings?.propertyAppreciation || 2.0,
      etfReturn: settings?.etfReturn || 7.0,
      years: settings?.years || 10
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching property settings:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Einstellungen' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: { 
        id: params.id,
        userId: session.userId
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Objekt nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    const newSettings = await request.json()

    // Upsert settings in database
    const settings = await prisma.propertySettings.upsert({
      where: { propertyId: params.id },
      update: {
        ...(newSettings.grossRentMultiplier !== undefined && { grossRentMultiplier: newSettings.grossRentMultiplier }),
        ...(newSettings.operatingExpenseRatio !== undefined && { operatingExpenseRatio: newSettings.operatingExpenseRatio }),
        ...(newSettings.valueAdjustment !== undefined && { valueAdjustment: newSettings.valueAdjustment }),
        ...(newSettings.propertyAppreciation !== undefined && { propertyAppreciation: newSettings.propertyAppreciation }),
        ...(newSettings.etfReturn !== undefined && { etfReturn: newSettings.etfReturn }),
        ...(newSettings.years !== undefined && { years: newSettings.years }),
        updatedAt: new Date()
      },
      create: {
        propertyId: params.id,
        grossRentMultiplier: newSettings.grossRentMultiplier || 12,
        operatingExpenseRatio: newSettings.operatingExpenseRatio || 25,
        valueAdjustment: newSettings.valueAdjustment || 0,
        propertyAppreciation: newSettings.propertyAppreciation || 2.0,
        etfReturn: newSettings.etfReturn || 7.0,
        years: newSettings.years || 10
      }
    })
    
    console.log('Saving settings for property:', params.id, settings)

    return NextResponse.json({ 
      message: 'Einstellungen gespeichert',
      settings
    })
  } catch (error) {
    console.error('Error saving property settings:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Einstellungen' },
      { status: 500 }
    )
  }
}
