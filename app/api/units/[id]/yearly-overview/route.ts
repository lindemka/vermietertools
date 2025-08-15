import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get unit with existing rentals and verify ownership
    const unit = await prisma.unit.findFirst({
      where: { 
        id: id,
        property: {
          userId: session.userId
        }
      },
      include: {
        rentals: {
          where: { year },
          orderBy: { month: 'asc' }
        }
      }
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Einheit nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    // Generate yearly overview with all 12 months
    const yearlyOverview = []
    for (let month = 1; month <= 12; month++) {
      const existingRental = unit.rentals.find(r => r.month === month)
      
      if (existingRental) {
        // Use stored values if available, otherwise fall back to standard values
        const rentAmount = existingRental.rentAmount !== null 
          ? Number(existingRental.rentAmount) 
          : Number(unit.monthlyRent)
        
        const utilitiesAmount = existingRental.utilitiesAmount !== null 
          ? Number(existingRental.utilitiesAmount) 
          : Number(unit.monthlyUtilities || 0)
        
        yearlyOverview.push({
          month,
          year,
          rentAmount,
          utilitiesAmount,
          totalAmount: Number(existingRental.amount),
          isPaid: existingRental.isPaid,
          notes: existingRental.notes,
          rentalId: existingRental.id,
          exists: true
        })
      } else {
        // Create placeholder for missing month
        yearlyOverview.push({
          month,
          year,
          rentAmount: Number(unit.monthlyRent),
          utilitiesAmount: Number(unit.monthlyUtilities || 0),
          totalAmount: Number(unit.monthlyRent) + Number(unit.monthlyUtilities || 0),
          isPaid: false,
          notes: '',
          rentalId: null,
          exists: false
        })
      }
    }

    return NextResponse.json({
      unit,
      yearlyOverview,
      year
    })
  } catch (error) {
    console.error('Error fetching yearly overview:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Jahresübersicht' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const { month, year, isPaid, notes, amount, rentAmount, utilitiesAmount } = await request.json()

    // Validation
    if (!month || !year) {
      return NextResponse.json(
        { error: 'Monat und Jahr sind erforderlich' },
        { status: 400 }
      )
    }

    // Get unit to calculate default amounts and verify ownership
    const unit = await prisma.unit.findFirst({
      where: { 
        id: id,
        property: {
          userId: session.userId
        }
      }
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Einheit nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    // Use provided amounts or calculate defaults
    const finalRentAmount = rentAmount !== undefined ? rentAmount : Number(unit.monthlyRent)
    const finalUtilitiesAmount = utilitiesAmount !== undefined ? utilitiesAmount : Number(unit.monthlyUtilities || 0)
    // Always calculate total from rent + utilities
    const totalAmount = finalRentAmount + finalUtilitiesAmount

    // Check if rental already exists
    const existingRental = await prisma.rental.findUnique({
      where: {
        unitId_month_year: {
          unitId: id,
          month,
          year
        }
      }
    })

    if (existingRental) {
      // Update existing rental
      const updatedRental = await prisma.rental.update({
        where: { id: existingRental.id },
        data: {
          amount: totalAmount,
          rentAmount: finalRentAmount,
          utilitiesAmount: finalUtilitiesAmount,
          isPaid: isPaid !== undefined ? isPaid : existingRental.isPaid,
          notes: notes !== undefined ? notes : existingRental.notes,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        message: 'Mieteinnahme aktualisiert',
        rental: updatedRental
      })
    } else {
      // Create new rental
      const newRental = await prisma.rental.create({
        data: {
          month,
          year,
          amount: totalAmount,
          rentAmount: finalRentAmount,
          utilitiesAmount: finalUtilitiesAmount,
          isPaid: isPaid || false,
          notes: notes || '',
          unitId: id
        }
      })

      return NextResponse.json({
        message: 'Mieteinnahme erstellt',
        rental: newRental
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error updating rental:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Aktualisieren der Mieteinnahme',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
