import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        isActive: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const propertyPeople = await prisma.propertyPerson.findMany({
      where: {
        propertyId: params.id,
        isActive: true,
      },
      include: {
        person: true,
      },
      orderBy: {
        person: {
          lastName: 'asc',
        },
      },
    });

    return NextResponse.json(propertyPeople);
  } catch (error) {
    console.error('Error fetching property people:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        isActive: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const body = await request.json();
    const { personId, role } = body;

    if (!personId || !role) {
      return NextResponse.json({ error: 'Person und Rolle sind erforderlich' }, { status: 400 });
    }

    // Verify person belongs to user
    const person = await prisma.person.findFirst({
      where: {
        id: personId,
        userId: user.id,
        isActive: true,
      },
    });

    if (!person) {
      return NextResponse.json({ error: 'Person nicht gefunden' }, { status: 404 });
    }

    // Check if relationship already exists (any role for this person and property)
    const existingRelationship = await prisma.propertyPerson.findFirst({
      where: {
        personId,
        propertyId: params.id,
        isActive: true,
      },
    });

    if (existingRelationship) {
      return NextResponse.json({ error: 'Person ist bereits diesem Objekt zugeordnet' }, { status: 400 });
    }

    // Check if there's an inactive relationship that we can reactivate
    const inactiveRelationship = await prisma.propertyPerson.findFirst({
      where: {
        personId,
        propertyId: params.id,
        isActive: false,
      },
    });

    let propertyPerson;
    if (inactiveRelationship) {
      // Reactivate the existing relationship with the new role
      propertyPerson = await prisma.propertyPerson.update({
        where: { id: inactiveRelationship.id },
        data: {
          role,
          isActive: true,
        },
        include: {
          person: true,
        },
      });
    } else {
      // Create a new relationship
      propertyPerson = await prisma.propertyPerson.create({
        data: {
          personId,
          propertyId: params.id,
          role,
        },
        include: {
          person: true,
        },
      });
    }

    return NextResponse.json(propertyPerson, { status: 201 });
  } catch (error) {
    console.error('Error adding person to property:', error);
    
    // Check for specific error types
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Person ist bereits diesem Objekt zugeordnet' }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('personId');

    if (!personId) {
      return NextResponse.json({ error: 'Person ID ist erforderlich' }, { status: 400 });
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        isActive: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Find the property-person relationship
    const propertyPerson = await prisma.propertyPerson.findFirst({
      where: {
        personId: personId,
        propertyId: params.id,
        isActive: true,
      },
    });

    if (!propertyPerson) {
      return NextResponse.json({ error: 'Person ist diesem Objekt nicht zugeordnet' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await prisma.propertyPerson.update({
      where: { id: propertyPerson.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Person erfolgreich vom Objekt entfernt' });
  } catch (error) {
    console.error('Error removing person from property:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
