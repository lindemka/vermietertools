const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testLogin() {
  try {
    console.log('🔍 Testing login functionality...')
    
    // Check if test user exists
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (!user) {
      console.log('❌ Test user not found')
      return
    }

    console.log('✅ Test user found:', user.email)
    console.log('📝 User details:', {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    })

    // Test password verification
    const testPassword = 'password123'
    const isValid = await bcrypt.compare(testPassword, user.password)
    
    if (isValid) {
      console.log('✅ Password verification successful')
    } else {
      console.log('❌ Password verification failed')
    }

    // Check sessions table
    const sessions = await prisma.session.findMany({
      where: { userId: user.id }
    })

    console.log(`📊 Found ${sessions.length} active sessions for user`)

    // List all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    console.log('👥 All users in database:')
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.name}) - Created: ${u.createdAt}`)
    })

  } catch (error) {
    console.error('❌ Error testing login:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()


