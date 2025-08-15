import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const unit = await prisma.unit.findFirst({
      where: { 
        id: id,
        property: {
          userId: session.id
        }
      },
      include: {
        rentals: {
          where: {
            year: new Date().getFullYear()
          },
          orderBy: {
            month: 'asc'
          }
        }
      }
    });

    if (!unit) {
      return NextResponse.json(
        { error: 'Einheit nicht gefunden' },
        { status: 404 }
      );
    }

    // Calculate standard rent based on existing rentals
    const currentYear = new Date().getFullYear();
    const yearRentals = unit.rentals.filter(rental => rental.year === currentYear);
    
    if (yearRentals.length === 0) {
      return NextResponse.json({
        standardRent: Number(unit.monthlyRent),
        standardUtilities: Number(unit.monthlyUtilities),
        totalAmount: Number(unit.monthlyRent) + Number(unit.monthlyUtilities),
        message: 'Keine Mietdaten für dieses Jahr vorhanden. Verwende Standardwerte.'
      });
    }

    // Calculate average rent and utilities
    const totalRent = yearRentals.reduce((sum, rental) => sum + Number(rental.rentAmount), 0);
    const totalUtilities = yearRentals.reduce((sum, rental) => sum + Number(rental.utilitiesAmount), 0);
    const totalAmount = yearRentals.reduce((sum, rental) => sum + Number(rental.amount), 0);

    const averageRent = totalRent / yearRentals.length;
    const averageUtilities = totalUtilities / yearRentals.length;
    const averageTotal = totalAmount / yearRentals.length;

    return NextResponse.json({
      standardRent: Math.round(averageRent),
      standardUtilities: Math.round(averageUtilities),
      totalAmount: Math.round(averageTotal),
      rentalCount: yearRentals.length,
      message: `Berechnet aus ${yearRentals.length} Mietzahlungen`
    });

  } catch (error) {
    console.error('Error fetching standard rent:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { standardRent, standardUtilities } = body;

    if (typeof standardRent !== 'number' || typeof standardUtilities !== 'number') {
      return NextResponse.json(
        { error: 'Standardmiete und Nebenkosten müssen Zahlen sein' },
        { status: 400 }
      );
    }

    // Verify unit belongs to user
    const unit = await prisma.unit.findFirst({
      where: { 
        id: id,
        property: {
          userId: session.id
        }
      }
    });

    if (!unit) {
      return NextResponse.json(
        { error: 'Einheit nicht gefunden' },
        { status: 404 }
      );
    }

    // Update unit with new standard values
    const updatedUnit = await prisma.unit.update({
      where: { id: id },
      data: {
        monthlyRent: standardRent,
        monthlyUtilities: standardUtilities
      }
    });

    return NextResponse.json({
      message: 'Standardmiete erfolgreich aktualisiert',
      unit: updatedUnit
    });

  } catch (error) {
    console.error('Error updating standard rent:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
