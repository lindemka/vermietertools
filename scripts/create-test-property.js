const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestProperty() {
  try {
    console.log('Creating test property...')
    
    // Find test user
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })
    
    if (!user) {
      console.log('Test user not found, creating...')
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('password123', 10)
      
      const newUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          name: 'Test User'
        }
      })
      console.log('Test user created:', newUser.id)
    }
    
    // Check if test property already exists
    const existingProperty = await prisma.property.findFirst({
      where: {
        name: 'Test Property',
        user: { email: 'test@example.com' }
      }
    })
    
    if (existingProperty) {
      console.log('Test property already exists:', existingProperty.id)
      return existingProperty.id
    }
    
    // Create test property
    const property = await prisma.property.create({
      data: {
        name: 'Test Property',
        address: 'Test Address 123',
        description: 'Test property for API testing',
        userId: user.id
      }
    })
    
    console.log('Test property created:', property.id)
    return property.id
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestProperty()
