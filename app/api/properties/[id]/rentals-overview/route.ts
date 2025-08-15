import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get property with all units and their rentals and verify ownership
    const property = await prisma.property.findFirst({
      where: { 
        id: id,
        userId: session.userId
      },
      include: {
        units: {
          include: {
            rentals: {
              where: { year },
              orderBy: { month: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Objekt nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    // Generate overview for each unit
    const unitsOverview = property.units.map(unit => {
      const monthlyOverview = []
      
      for (let month = 1; month <= 12; month++) {
        const existingRental = unit.rentals.find(r => r.month === month)
        
        if (existingRental) {
          monthlyOverview.push({
            month,
            year,
            rentAmount: Number(unit.monthlyRent),
            utilitiesAmount: Number(unit.monthlyUtilities || 0),
            totalAmount: Number(existingRental.amount),
            isPaid: existingRental.isPaid,
            notes: existingRental.notes,
            rentalId: existingRental.id,
            exists: true
          })
        } else {
          monthlyOverview.push({
            month,
            year,
            rentAmount: Number(unit.monthlyRent),
            utilitiesAmount: Number(unit.monthlyUtilities || 0),
            totalAmount: Number(unit.monthlyRent) + Number(unit.monthlyUtilities || 0),
            isPaid: false,
            notes: '',
            rentalId: null,
            exists: false
          })
        }
      }

      const totalRent = monthlyOverview.reduce((sum, item) => sum + item.rentAmount, 0)
      const totalUtilities = monthlyOverview.reduce((sum, item) => sum + item.utilitiesAmount, 0)
      const totalExpected = monthlyOverview.reduce((sum, item) => sum + item.totalAmount, 0)
      const totalPaid = monthlyOverview
        .filter(item => item.isPaid)
        .reduce((sum, item) => sum + item.totalAmount, 0)
      const totalUnpaid = totalExpected - totalPaid

      return {
        unit,
        monthlyOverview,
        totals: {
          totalRent,
          totalUtilities,
          totalExpected,
          totalPaid,
          totalUnpaid
        }
      }
    })

    // Calculate property totals
    const propertyTotals = unitsOverview.reduce((acc, unitOverview) => ({
      totalRent: acc.totalRent + unitOverview.totals.totalRent,
      totalUtilities: acc.totalUtilities + unitOverview.totals.totalUtilities,
      totalExpected: acc.totalExpected + unitOverview.totals.totalExpected,
      totalPaid: acc.totalPaid + unitOverview.totals.totalPaid,
      totalUnpaid: acc.totalUnpaid + unitOverview.totals.totalUnpaid
    }), {
      totalRent: 0,
      totalUtilities: 0,
      totalExpected: 0,
      totalPaid: 0,
      totalUnpaid: 0
    })

    return NextResponse.json({
      property,
      unitsOverview,
      propertyTotals,
      year
    })
  } catch (error) {
    console.error('Error fetching property rentals overview:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Mieteinnahmen-Übersicht' },
      { status: 500 }
    )
  }
}
