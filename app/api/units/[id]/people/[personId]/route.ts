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

    // Verify unit belongs to user's property
    const unit = await prisma.unit.findFirst({
      where: {
        id: params.id,
        property: {
          userId: user.id,
          isActive: true,
        },
        isActive: true,
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Einheit nicht gefunden' }, { status: 404 });
    }

    // Find the unit-person relationship by personId and unitId
    const unitPerson = await prisma.unitPerson.findFirst({
      where: {
        personId: params.personId,
        unitId: params.id,
        isActive: true,
      },
    });

    if (!unitPerson) {
      return NextResponse.json({ error: 'Person ist dieser Einheit nicht zugeordnet' }, { status: 404 });
    }

    // Update the role
    await prisma.unitPerson.update({
      where: { id: unitPerson.id },
      data: { role },
    });

    return NextResponse.json({ message: 'Rolle erfolgreich aktualisiert' });
  } catch (error) {
    console.error('Error updating person role in unit:', error);
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

    // Verify unit belongs to user's property
    const unit = await prisma.unit.findFirst({
      where: {
        id: params.id,
        property: {
          userId: user.id,
          isActive: true,
        },
        isActive: true,
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Einheit nicht gefunden' }, { status: 404 });
    }

    // Find the unit-person relationship by personId and unitId
    const unitPerson = await prisma.unitPerson.findFirst({
      where: {
        personId: params.personId,
        unitId: params.id,
        isActive: true,
      },
    });

    if (!unitPerson) {
      return NextResponse.json({ error: 'Person ist dieser Einheit nicht zugeordnet' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await prisma.unitPerson.update({
      where: { id: unitPerson.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Person erfolgreich von der Einheit entfernt' });
  } catch (error) {
    console.error('Error removing person from unit:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
