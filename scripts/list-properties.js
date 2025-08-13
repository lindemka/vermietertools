const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function listProperties() {
  try {
    console.log('Listing all properties...')
    
    const properties = await prisma.property.findMany({
      include: {
        user: true,
        units: true
      }
    })
    
    console.log(`Found ${properties.length} properties:`)
    properties.forEach(prop => {
      console.log(`- ID: ${prop.id}`)
      console.log(`  Name: ${prop.name}`)
      console.log(`  User: ${prop.user.email}`)
      console.log(`  Units: ${prop.units.length}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listProperties()
