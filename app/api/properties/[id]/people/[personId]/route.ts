import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromSession } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; personId: string } }
) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: 'Rolle ist erforderlich' }, { status: 400 });
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
      return NextResponse.json({ error: 'Objekt nicht gefunden' }, { status: 404 });
    }

    // Find the property-person relationship by personId and propertyId
    const propertyPerson = await prisma.propertyPerson.findFirst({
      where: {
        personId: params.personId,
        propertyId: params.id,
        isActive: true,
      },
    });

    if (!propertyPerson) {
      return NextResponse.json({ error: 'Person ist diesem Objekt nicht zugeordnet' }, { status: 404 });
    }

    // Update the role
    await prisma.propertyPerson.update({
      where: { id: propertyPerson.id },
      data: { role },
    });

    return NextResponse.json({ message: 'Rolle erfolgreich aktualisiert' });
  } catch (error) {
    console.error('Error updating person role in property:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; personId: string } }
) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
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
      return NextResponse.json({ error: 'Objekt nicht gefunden' }, { status: 404 });
    }

    // Find the property-person relationship by personId and propertyId
    const propertyPerson = await prisma.propertyPerson.findFirst({
      where: {
        personId: params.personId,
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
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
