import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { monthlyRent, monthlyUtilities, effectiveFromMonth, effectiveFromYear, forceUpdate } = await request.json()

    // Validation
    if (!monthlyRent || monthlyRent < 0) {
      return NextResponse.json(
        { error: 'Monatliche Miete ist erforderlich und muss größer oder gleich 0 sein' },
        { status: 400 }
      )
    }

    if (monthlyUtilities && monthlyUtilities < 0) {
      return NextResponse.json(
        { error: 'Nebenkosten dürfen nicht negativ sein' },
        { status: 400 }
      )
    }

    if (!effectiveFromMonth || !effectiveFromYear) {
      return NextResponse.json(
        { error: 'Gültig ab Monat und Jahr sind erforderlich' },
        { status: 400 }
      )
    }

    // Get unit with existing rentals and verify ownership
    const unit = await prisma.unit.findFirst({
      where: { 
        id: params.id,
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

    // Check for existing non-standard values from the effective date onwards
    const effectiveDate = new Date(effectiveFromYear, effectiveFromMonth - 1)
    const existingNonStandardRentals = unit.rentals.filter(rental => {
      const rentalDate = new Date(rental.year, rental.month - 1)
      const currentStandardTotal = Number(unit.monthlyRent) + Number(unit.monthlyUtilities || 0)
      return rentalDate >= effectiveDate && Number(rental.amount) !== currentStandardTotal
    })

    // If there are existing non-standard values and forceUpdate is not true, return warning
    if (existingNonStandardRentals.length > 0 && !forceUpdate) {
      return NextResponse.json({
        warning: true,
        message: `Es gibt bereits ${existingNonStandardRentals.length} Mieteinnahme(n) mit abweichenden Beträgen ab ${effectiveFromMonth}/${effectiveFromYear}. Möchten Sie diese überschreiben?`,
        affectedRentals: existingNonStandardRentals.map(r => ({
          month: r.month,
          year: r.year,
          currentAmount: r.amount,
          newAmount: monthlyRent + (monthlyUtilities || 0)
        }))
      }, { status: 409 })
    }

    // Update unit with new standard values
    const updatedUnit = await prisma.unit.update({
      where: { id: params.id },
      data: {
        monthlyRent,
        monthlyUtilities: monthlyUtilities || null,
        updatedAt: new Date()
      }
    })

    // If forceUpdate is true, update all affected rentals
    if (forceUpdate && existingNonStandardRentals.length > 0) {
      const newStandardTotal = monthlyRent + (monthlyUtilities || 0)
      
      for (const rental of existingNonStandardRentals) {
        await prisma.rental.update({
          where: { id: rental.id },
          data: {
            amount: newStandardTotal,
            rentAmount: monthlyRent,
            utilitiesAmount: monthlyUtilities || 0,
            updatedAt: new Date()
          }
        })
      }
    }

    // Pre-fill future months with new standard values
    const currentDate = new Date()
    
    // Only pre-fill if effective date is in the future or current month
    if (effectiveDate >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)) {
      const newStandardTotal = monthlyRent + (monthlyUtilities || 0)
      
      // Pre-fill for the next 12 months from effective date
      for (let i = 0; i < 12; i++) {
        const targetDate = new Date(effectiveDate)
        targetDate.setMonth(targetDate.getMonth() + i)
        
        const targetMonth = targetDate.getMonth() + 1
        const targetYear = targetDate.getFullYear()
        
        // Check if rental already exists for this month
        const existingRental = await prisma.rental.findUnique({
          where: {
            unitId_month_year: {
              unitId: params.id,
              month: targetMonth,
              year: targetYear
            }
          }
        })
        
        // Only create if it doesn't exist
        if (!existingRental) {
          await prisma.rental.create({
            data: {
              month: targetMonth,
              year: targetYear,
              amount: newStandardTotal,
              rentAmount: monthlyRent,
              utilitiesAmount: monthlyUtilities || 0,
              isPaid: false,
              notes: '',
              unitId: params.id
            }
          })
        }
      }
    }

    return NextResponse.json({
      message: 'Standard-Miete erfolgreich aktualisiert',
      unit: updatedUnit,
      updatedRentals: forceUpdate ? existingNonStandardRentals.length : 0
    })
  } catch (error) {
    console.error('Error updating standard rent:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Standard-Miete' },
      { status: 500 }
    )
  }
}
