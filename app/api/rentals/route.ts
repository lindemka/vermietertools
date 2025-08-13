import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unitId')
    const rentalId = searchParams.get('rentalId')

    if (rentalId) {
      // Get single rental and verify ownership
      const rental = await prisma.rental.findFirst({
        where: { 
          id: rentalId,
          unit: {
            property: {
              userId: session.userId
            }
          }
        }
      })

      if (!rental) {
        return NextResponse.json(
          { error: 'Mieteinnahme nicht gefunden oder Zugriff verweigert' },
          { status: 404 }
        )
      }

      return NextResponse.json({ rentals: [rental] })
    }

    if (!unitId) {
      return NextResponse.json(
        { error: 'Unit ID ist erforderlich' },
        { status: 400 }
      )
    }

    // Verify the unit belongs to a property owned by the authenticated user
    const unit = await prisma.unit.findFirst({
      where: {
        id: unitId,
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

    const rentals = await prisma.rental.findMany({
      where: {
        unitId: unitId
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    return NextResponse.json({ rentals })
  } catch (error) {
    console.error('Error fetching rentals:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Mieteinnahmen' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { month, year, amount, isPaid, notes, unitId } = await request.json()

    // Validation
    if (!month || !year || !amount || !unitId) {
      return NextResponse.json(
        { error: 'Monat, Jahr, Betrag und Unit ID sind erforderlich' },
        { status: 400 }
      )
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Monat muss zwischen 1 und 12 liegen' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Betrag muss größer als 0 sein' },
        { status: 400 }
      )
    }

    // Check if unit exists and belongs to the authenticated user
    const unit = await prisma.unit.findFirst({
      where: {
        id: unitId,
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

    // Check if rental for this month/year already exists
    const existingRental = await prisma.rental.findUnique({
      where: {
        unitId_month_year: {
          unitId,
          month,
          year
        }
      }
    })

    if (existingRental) {
      return NextResponse.json(
        { error: 'Mieteinnahme für diesen Monat/Jahr existiert bereits' },
        { status: 400 }
      )
    }

    const rental = await prisma.rental.create({
      data: {
        month,
        year,
        amount,
        isPaid: isPaid || false,
        notes,
        unitId,
      }
    })

    return NextResponse.json(
      { message: 'Mieteinnahme erfolgreich erstellt', rental },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating rental:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Mieteinnahme' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { id, month, year, amount, isPaid, notes } = await request.json()

    // Validation
    if (!id || !month || !year || !amount) {
      return NextResponse.json(
        { error: 'ID, Monat, Jahr und Betrag sind erforderlich' },
        { status: 400 }
      )
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Monat muss zwischen 1 und 12 liegen' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Betrag muss größer als 0 sein' },
        { status: 400 }
      )
    }

    // Verify the rental belongs to a unit owned by the authenticated user
    const existingRental = await prisma.rental.findFirst({
      where: {
        id: id,
        unit: {
          property: {
            userId: session.userId
          }
        }
      }
    })

    if (!existingRental) {
      return NextResponse.json(
        { error: 'Mieteinnahme nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    const rental = await prisma.rental.update({
      where: { id },
      data: {
        month,
        year,
        amount,
        isPaid: isPaid !== undefined ? isPaid : false,
        notes,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(
      { message: 'Mieteinnahme erfolgreich aktualisiert', rental },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating rental:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Mieteinnahme' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Rental ID ist erforderlich' },
        { status: 400 }
      )
    }

    // Verify the rental belongs to a unit owned by the authenticated user
    const existingRental = await prisma.rental.findFirst({
      where: {
        id: id,
        unit: {
          property: {
            userId: session.userId
          }
        }
      }
    })

    if (!existingRental) {
      return NextResponse.json(
        { error: 'Mieteinnahme nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    await prisma.rental.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Mieteinnahme erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting rental:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Mieteinnahme' },
      { status: 500 }
    )
  }
}
