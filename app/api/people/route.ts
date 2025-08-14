import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromSession } from '@/lib/session';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const whereClause = {
      userId: user.id,
      isActive: true,
      OR: search ? [
        { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { lastName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
        // Add full name search
        {
          AND: [
            { firstName: { contains: search.split(' ')[0], mode: Prisma.QueryMode.insensitive } },
            { lastName: { contains: search.split(' ')[1] || '', mode: Prisma.QueryMode.insensitive } }
          ]
        }
      ] : undefined,
    };

    const [people, total] = await Promise.all([
      prisma.person.findMany({
        where: whereClause,
        include: {
          propertyRoles: {
            where: { isActive: true },
            include: {
              property: {
                select: { id: true, name: true }
              }
            }
          },
          unitRoles: {
            where: { isActive: true },
            include: {
              unit: {
                select: { id: true, name: true, property: { select: { id: true, name: true } } }
              }
            }
          }
        },
        orderBy: { lastName: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.person.count({ where: whereClause })
    ]);

    return NextResponse.json({
      people,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching people:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, notes } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    const person = await prisma.person.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        notes,
        userId: user.id,
      },
    });

    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
