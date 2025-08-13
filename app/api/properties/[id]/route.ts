import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(
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

    const property = await prisma.property.findFirst({
      where: { 
        id: params.id,
        userId: session.userId
      },
      include: {
        units: {
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
        }
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Objekt nicht gefunden oder Zugriff verweigert' },
        { status: 404 }
      )
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden des Objekts' },
      { status: 500 }
    )
  }
}
