import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    // Get current user session
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Only return properties belonging to the authenticated user
    const properties = await prisma.property.findMany({
      where: {
        userId: session.userId
      },
      include: {
        units: {
          include: {
            rentals: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ properties })
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Laden der Objekte',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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

      const { name, address, description, isSimpleMode, monthlyRent } = await request.json()

          // Validation
      if (!name || !address) {
        return NextResponse.json(
          { error: 'Name und Adresse sind erforderlich' },
          { status: 400 }
        )
      }

      if (isSimpleMode && (!monthlyRent || monthlyRent <= 0)) {
        return NextResponse.json(
          { error: 'Monatliche Miete ist im Einfach-Modus erforderlich und muss größer als 0 sein' },
          { status: 400 }
        )
      }

    // Use the authenticated user's ID
    const userId = session.userId

    const property = await prisma.property.create({
      data: {
        name,
        address,
        description,
        userId,
        updatedAt: new Date(),
      },
      include: {
        units: {
          include: {
            rentals: true
          }
        }
      }
    })

    // If simple mode, create a default unit
    if (isSimpleMode) {
      await prisma.unit.create({
        data: {
          name: 'Hauptobjekt',
          type: 'wohnung',
          monthlyRent: monthlyRent,
          description: 'Standard-Einheit für einfaches Objekt',
          propertyId: property.id,
        }
      })
    }

    // Fetch the updated property with the new unit
    const updatedProperty = await prisma.property.findUnique({
      where: { id: property.id },
      include: {
        units: {
          include: {
            rentals: true
          }
        }
      }
    })

    return NextResponse.json(
      { message: 'Objekt erfolgreich erstellt', property: updatedProperty },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen des Objekts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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

    const { id, name, address, description, isActive, isSimpleMode, monthlyRent } = await request.json()

    // Validation
    if (!id || !name || !address) {
      return NextResponse.json(
        { error: 'ID, Name und Adresse sind erforderlich' },
        { status: 400 }
      )
    }

    if (isSimpleMode && (!monthlyRent || monthlyRent <= 0)) {
      return NextResponse.json(
        { error: 'Monatliche Miete ist im Einfach-Modus erforderlich und muss größer als 0 sein' },
        { status: 400 }
      )
    }

    // Verify the property belongs to the authenticated user
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: id,
        userId: session.userId
      }
    })

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Objekt nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        name,
        address,
        description,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      },
      include: {
        units: {
          include: {
            rentals: true
          }
        }
      }
    })

    // Handle simple mode unit update
    if (isSimpleMode) {
      const existingUnit = property.units.find((unit: any) => unit.name === 'Hauptobjekt')
      
      if (existingUnit) {
        // Update existing simple mode unit
        await prisma.unit.update({
          where: { id: existingUnit.id },
          data: {
            monthlyRent: monthlyRent,
            updatedAt: new Date(),
          }
        })
      } else {
        // Create new simple mode unit
        await prisma.unit.create({
          data: {
            name: 'Hauptobjekt',
            type: 'wohnung',
            monthlyRent: monthlyRent,
            description: 'Standard-Einheit für einfaches Objekt',
            propertyId: property.id,
          }
        })
      }
    }

    // Fetch the updated property
    const updatedProperty = await prisma.property.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            rentals: true
          }
        }
      }
    })

    return NextResponse.json(
      { message: 'Objekt erfolgreich aktualisiert', property: updatedProperty },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Aktualisieren des Objekts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
        { error: 'Property ID ist erforderlich' },
        { status: 400 }
      )
    }

    // Verify the property belongs to the authenticated user
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: id,
        userId: session.userId
      }
    })

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Objekt nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    // Delete property (this will cascade delete units and rentals)
    await prisma.property.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Objekt erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Löschen des Objekts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
