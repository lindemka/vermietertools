const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSecondExampleProperty() {
  try {
    console.log('Creating second example property...')

    // First, find the example user
    const user = await prisma.user.findFirst({
      where: {
        email: 'example@example.com'
      }
    })

    if (!user) {
      console.log('Example user not found, creating...')
      const newUser = await prisma.user.create({
        data: {
          name: 'Example User',
          email: 'example@example.com',
          password: 'hashedpassword123'
        }
      })
      console.log('Created example user:', newUser.id)
    }

    const userId = user ? user.id : (await prisma.user.findFirst({ where: { email: 'example@example.com' } })).id

    // Create second property
    const property = await prisma.property.create({
      data: {
        name: 'Mietwohnung München Zentrum',
        address: 'Maximilianstraße 45, 80539 München',
        description: 'Moderne 3-Zimmer-Wohnung im Herzen von München, perfekte Lage für Studenten und Berufstätige.',
        isActive: true,
        userId: userId
      }
    })

    console.log('Created property:', property.id)

    // Create units for the property
    const units = [
      {
        name: 'Wohnung 1A',
        type: '3-Zimmer-Wohnung',
        size: '85m²',
        description: 'Helle 3-Zimmer-Wohnung mit Balkon und Tiefgarage',
        monthlyRent: 2800,
        monthlyUtilities: 250,
        isActive: true,
        propertyId: property.id
      },
      {
        name: 'Wohnung 1B',
        type: '2-Zimmer-Wohnung',
        size: '65m²',
        description: 'Gemütliche 2-Zimmer-Wohnung mit Stadtblick',
        monthlyRent: 2200,
        monthlyUtilities: 200,
        isActive: true,
        propertyId: property.id
      }
    ]

    for (const unitData of units) {
      const unit = await prisma.unit.create({
        data: unitData
      })
      console.log('Created unit:', unit.name)

      // Create some rental history for each unit
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()

      // Create rentals for the last 6 months
      for (let i = 5; i >= 0; i--) {
        const rentalDate = new Date(currentYear, currentMonth - i - 1, 1)
        const rentalMonth = rentalDate.getMonth() + 1
        const rentalYear = rentalDate.getFullYear()

        await prisma.rental.create({
          data: {
            month: rentalMonth,
            year: rentalYear,
            amount: unitData.monthlyRent + unitData.monthlyUtilities,
            rentAmount: unitData.monthlyRent,
            utilitiesAmount: unitData.monthlyUtilities,
            isPaid: Math.random() > 0.2, // 80% chance of being paid
            notes: rentalMonth === currentMonth && rentalYear === currentYear ? 'Aktueller Monat' : '',
            unitId: unit.id
          }
        })
      }
    }

    // Create some people and assign them to units
    const people = [
      {
        firstName: 'Anna',
        lastName: 'Schmidt',
        email: 'anna.schmidt@email.com',
        phone: '+49 89 12345678',
        isActive: true,
        userId: userId
      },
      {
        firstName: 'Michael',
        lastName: 'Weber',
        email: 'michael.weber@email.com',
        phone: '+49 89 87654321',
        isActive: true,
        userId: userId
      }
    ]

    for (let i = 0; i < people.length; i++) {
      const person = await prisma.person.create({
        data: people[i]
      })
      console.log('Created person:', `${person.firstName} ${person.lastName}`)

      // Assign person to unit
      const unit = await prisma.unit.findFirst({
        where: {
          propertyId: property.id
        },
        skip: i
      })

      if (unit) {
        await prisma.unitPerson.create({
          data: {
            personId: person.id,
            unitId: unit.id,
            role: 'tenant',
            isActive: true
          }
        })
        console.log(`Assigned ${person.firstName} ${person.lastName} to ${unit.name}`)
      }
    }

    console.log('Second example property created successfully!')
    console.log('Property ID:', property.id)
    console.log('Property name:', property.name)
    console.log('Units created:', units.length)
    console.log('People created and assigned:', people.length)

  } catch (error) {
    console.error('Error creating second example property:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSecondExampleProperty()
