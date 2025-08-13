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
    const propertyId = searchParams.get('propertyId')
    const unitId = searchParams.get('unitId')

    if (unitId) {
      // Get single unit and verify ownership
      const unit = await prisma.unit.findFirst({
        where: { 
          id: unitId,
          property: {
            userId: session.userId
          }
        },
        include: {
          rentals: {
            orderBy: [
              { year: 'desc' },
              { month: 'desc' }
            ]
          }
        }
      })

      if (!unit) {
        return NextResponse.json(
          { error: 'Einheit nicht gefunden oder Zugriff verweigert' },
          { status: 404 }
        )
      }

      return NextResponse.json({ units: [unit] })
    }

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID ist erforderlich' },
        { status: 400 }
      )
    }

    // Verify the property belongs to the authenticated user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: session.userId
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Objekt nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    const units = await prisma.unit.findMany({
      where: {
        propertyId: propertyId
      },
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
    })

    return NextResponse.json({ units })
  } catch (error) {
    console.error('Error fetching units:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Einheiten' },
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

      const { name, type, monthlyRent, monthlyUtilities, size, description, propertyId } = await request.json()

      // Validation
      if (!name || !type || !monthlyRent || !propertyId) {
        return NextResponse.json(
          { error: 'Name, Typ, monatliche Miete und Property ID sind erforderlich' },
          { status: 400 }
        )
      }

      if (monthlyRent <= 0) {
        return NextResponse.json(
          { error: 'Monatliche Miete muss größer als 0 sein' },
          { status: 400 }
        )
      }

      if (monthlyUtilities && monthlyUtilities < 0) {
        return NextResponse.json(
          { error: 'Nebenkosten dürfen nicht negativ sein' },
          { status: 400 }
        )
      }

    // Check if property exists and belongs to the authenticated user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: session.userId
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Objekt nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

          const unit = await prisma.unit.create({
        data: {
          name,
          type,
          monthlyRent,
          monthlyUtilities,
          size,
          description,
          propertyId,
        },
        include: {
          rentals: true
        }
      })

    return NextResponse.json(
      { message: 'Einheit erfolgreich erstellt', unit },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating unit:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Einheit' },
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

    const { id, name, type, monthlyRent, size, description, isActive } = await request.json()

    // Validation
    if (!id || !name || !type || !monthlyRent) {
      return NextResponse.json(
        { error: 'ID, Name, Typ und monatliche Miete sind erforderlich' },
        { status: 400 }
      )
    }

    if (monthlyRent <= 0) {
      return NextResponse.json(
        { error: 'Monatliche Miete muss größer als 0 sein' },
        { status: 400 }
      )
    }

    // Verify the unit belongs to a property owned by the authenticated user
    const existingUnit = await prisma.unit.findFirst({
      where: {
        id: id,
        property: {
          userId: session.userId
        }
      }
    })

    if (!existingUnit) {
      return NextResponse.json(
        { error: 'Einheit nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        name,
        type,
        monthlyRent,
        size,
        description,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      },
      include: {
        rentals: true
      }
    })

    return NextResponse.json(
      { message: 'Einheit erfolgreich aktualisiert', unit },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating unit:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Einheit' },
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
        { error: 'Unit ID ist erforderlich' },
        { status: 400 }
      )
    }

    // Verify the unit belongs to a property owned by the authenticated user
    const existingUnit = await prisma.unit.findFirst({
      where: {
        id: id,
        property: {
          userId: session.userId
        }
      }
    })

    if (!existingUnit) {
      return NextResponse.json(
        { error: 'Einheit nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    // Delete unit (this will cascade delete rentals)
    await prisma.unit.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Einheit erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting unit:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Einheit' },
      { status: 500 }
    )
  }
}
