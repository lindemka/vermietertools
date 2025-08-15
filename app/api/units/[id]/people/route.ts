import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify unit belongs to user's property
    const unit = await prisma.unit.findFirst({
      where: {
        id: id,
        property: {
          userId: user.id,
          isActive: true,
        },
        isActive: true,
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    const unitPeople = await prisma.unitPerson.findMany({
      where: {
        unitId: id,
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

    return NextResponse.json(unitPeople);
  } catch (error) {
    console.error('Error fetching unit people:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify unit belongs to user's property
    const unit = await prisma.unit.findFirst({
      where: {
        id: id,
        property: {
          userId: user.id,
          isActive: true,
        },
        isActive: true,
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
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

    // Check if relationship already exists
    const existingRelationship = await prisma.unitPerson.findFirst({
      where: {
        personId,
        unitId: id,
        isActive: true,
      },
    });

    if (existingRelationship) {
      return NextResponse.json({ error: 'Person ist bereits dieser Einheit zugeordnet' }, { status: 400 });
    }

    // Create new relationship
    const unitPerson = await prisma.unitPerson.create({
      data: {
        personId,
        unitId: id,
        role,
        isActive: true,
      },
      include: {
        person: true,
      },
    });

    return NextResponse.json(unitPerson);
  } catch (error) {
    console.error('Error assigning person to unit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify unit belongs to user's property
    const unit = await prisma.unit.findFirst({
      where: {
        id: id,
        property: {
          userId: user.id,
          isActive: true,
        },
        isActive: true,
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    const body = await request.json();
    const { personId } = body;

    if (!personId) {
      return NextResponse.json({ error: 'Person ID ist erforderlich' }, { status: 400 });
    }

    // Find the unit-person relationship
    const unitPerson = await prisma.unitPerson.findFirst({
      where: {
        personId,
        unitId: id,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
