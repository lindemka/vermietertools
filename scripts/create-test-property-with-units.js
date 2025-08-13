const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestPropertyWithUnits() {
  try {
    console.log('Creating test property with units...')
    
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
        name: 'Test Property with Units',
        user: { email: 'test@example.com' }
      },
      include: {
        units: true
      }
    })
    
    if (existingProperty) {
      console.log('Test property already exists:', existingProperty.id)
      console.log('Units:', existingProperty.units.length)
      return existingProperty.id
    }
    
    // Create test property with units
    const property = await prisma.property.create({
      data: {
        name: 'Test Property with Units',
        address: 'Test Address 123',
        description: 'Test property with units for API testing',
        userId: user.id,
        units: {
          create: [
            {
              name: 'Unit 1',
              type: 'Wohnung',
              monthlyRent: 1200.00,
              monthlyUtilities: 150.00,
              size: '80m²',
              description: 'Test unit 1'
            },
            {
              name: 'Unit 2', 
              type: 'Wohnung',
              monthlyRent: 1000.00,
              monthlyUtilities: 120.00,
              size: '65m²',
              description: 'Test unit 2'
            }
          ]
        }
      },
      include: {
        units: true
      }
    })
    
    console.log('Test property created:', property.id)
    console.log('Units created:', property.units.length)
    property.units.forEach(unit => {
      console.log(`- ${unit.name}: ${unit.monthlyRent}€ + ${unit.monthlyUtilities}€ utilities`)
    })
    
    return property.id
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestPropertyWithUnits()
