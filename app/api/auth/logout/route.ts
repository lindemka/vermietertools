import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/session'

export async function POST() {
  try {
    await destroySession()
    
    return NextResponse.json(
      { message: 'Erfolgreich abgemeldet' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abmelden' },
      { status: 500 }
    )
  }
}
