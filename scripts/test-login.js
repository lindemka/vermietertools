const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testLogin() {
  try {
    console.log('Testing login functionality...')
    
    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })
    
    if (!user) {
      console.log('User not found')
      return
    }
    
    console.log('User found:', user.email)
    
    // 2. Test password verification
    const isValid = await bcrypt.compare('password123', user.password)
    console.log('Password valid:', isValid)
    
    // 3. Test session creation
    const sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    
    const session = await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt: expiresAt
      }
    })
    
    console.log('Session created:', session.id)
    
    // 4. Test session retrieval
    const retrievedSession = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    })
    
    console.log('Session retrieved:', retrievedSession ? 'success' : 'failed')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()


