import { cookies } from 'next/headers'
import { prisma } from './db'

export interface Session {
  userId: string
  email: string
  name: string
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session-token')?.value
  
  if (!sessionToken) {
    return null
  }
  
  try {
    // Clean up expired sessions first
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
    
    // Find the session in the database
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    })
    
    if (!session || session.expiresAt < new Date()) {
      // Session expired or doesn't exist, clean it up
      if (session) {
        await prisma.session.delete({ where: { id: session.id } })
      }
      return null
    }
    
    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name
    }
  } catch (error) {
    console.error('Error retrieving session:', error)
    return null
  }
}

export async function getUserFromSession(): Promise<{ id: string; email: string; name: string } | null> {
  const session = await getSession()
  if (!session) {
    return null
  }
  
  return {
    id: session.userId,
    email: session.email,
    name: session.name
  }
}

export async function createSession(userId: string): Promise<string> {
  const sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  
  // Store session in database
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now
  
  await prisma.session.create({
    data: {
      token: sessionToken,
      userId: userId,
      expiresAt: expiresAt
    }
  })
  
  return sessionToken
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session-token')?.value
  
  if (sessionToken) {
    try {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { token: sessionToken }
      })
    } catch (error) {
      console.error('Error destroying session:', error)
    }
  }
  
  // Clear the cookie
  cookieStore.delete('session-token')
  
  // Also set an expired cookie to ensure it's cleared
  cookieStore.set('session-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}
