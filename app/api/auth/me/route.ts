import { NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/session'

export async function GET() {
  try {
    const user = await getUserFromSession()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Nicht angemeldet' },
        { status: 401 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error getting user session:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
