import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const propertyId = url.searchParams.get('id')
    
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
    }

    // Get current user session
    const session = await getSession()
    console.log('Session:', session)
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Check if property exists at all
    const allProperties = await prisma.property.findMany({
      select: { id: true, name: true, userId: true }
    })
    console.log('All properties:', allProperties)

    const property = await prisma.property.findFirst({
      where: { 
        id: propertyId,
        userId: session.userId
      },
      include: {
        units: true
      }
    })

    console.log('Found property:', property)

    if (!property) {
      return NextResponse.json({
        error: 'Objekt nicht gefunden',
        propertyId,
        userId: session.userId,
        allProperties: allProperties.map(p => ({ id: p.id, name: p.name, userId: p.userId }))
      }, { status: 404 })
    }

    return NextResponse.json({ property, session: { userId: session.userId } })
  } catch (error) {
    console.error('Error in test route:', error)
    return NextResponse.json({ error: 'Test error', details: error }, { status: 500 })
  }
}


