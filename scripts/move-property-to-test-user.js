const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function movePropertyToTestUser() {
  try {
    console.log('Moving property to test@example.com user...')

    // Find the test user
    const testUser = await prisma.user.findFirst({
      where: {
        email: 'test@example.com'
      }
    })

    if (!testUser) {
      console.log('Test user not found!')
      return
    }

    console.log('Found test user:', testUser.id)

    // Find the Munich property
    const munichProperty = await prisma.property.findFirst({
      where: {
        name: 'Mietwohnung München Zentrum'
      }
    })

    if (!munichProperty) {
      console.log('Munich property not found!')
      return
    }

    console.log('Found Munich property:', munichProperty.id)

    // Update the property to belong to test user
    await prisma.property.update({
      where: {
        id: munichProperty.id
      },
      data: {
        userId: testUser.id
      }
    })

    console.log('Successfully moved property to test@example.com user!')

    // Verify the change
    const updatedProperty = await prisma.property.findFirst({
      where: {
        name: 'Mietwohnung München Zentrum'
      },
      include: {
        user: true
      }
    })

    console.log('Property now belongs to:', updatedProperty.user.email)

  } catch (error) {
    console.error('Error moving property:', error)
  } finally {
    await prisma.$disconnect()
  }
}

movePropertyToTestUser()
