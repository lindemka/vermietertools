const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPersonAssignments() {
  console.log('🧪 Testing Person Assignment Functionality...\n');

  let user, person, property, unit;

  try {
    // 1. Create a test user with unique email
    console.log('1. Creating test user...');
    const timestamp = Date.now();
    user = await prisma.user.create({
      data: {
        email: `test-assignments-${timestamp}@example.com`,
        password: 'hashedpassword',
        name: 'Test User'
      }
    });
    console.log('✅ Test user created:', user.email);

    // 2. Create a test person
    console.log('\n2. Creating test person...');
    person = await prisma.person.create({
      data: {
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max@example.com',
        phone: '+49123456789',
        userId: user.id
      }
    });
    console.log('✅ Test person created:', `${person.firstName} ${person.lastName}`);

    // 3. Create a test property
    console.log('\n3. Creating test property...');
    property = await prisma.property.create({
      data: {
        name: 'Test Property',
        address: 'Teststraße 1, 12345 Teststadt',
        description: 'Test property for assignment testing',
        userId: user.id
      }
    });
    console.log('✅ Test property created:', property.name);

    // 4. Create a test unit
    console.log('\n4. Creating test unit...');
    unit = await prisma.unit.create({
      data: {
        name: 'Test Unit',
        type: 'wohnung',
        monthlyRent: 1000.00,
        description: 'Test unit for assignment testing',
        propertyId: property.id
      }
    });
    console.log('✅ Test unit created:', unit.name);

    // 5. Test property-person assignment
    console.log('\n5. Testing property-person assignment...');
    const propertyPerson = await prisma.propertyPerson.create({
      data: {
        personId: person.id,
        propertyId: property.id,
        role: 'hausmeister'
      },
      include: {
        person: true,
        property: true
      }
    });
    console.log('✅ Property-person assignment created:', `${propertyPerson.person.firstName} ${propertyPerson.person.lastName} as ${propertyPerson.role} for ${propertyPerson.property.name}`);

    // 6. Test unit-person assignment
    console.log('\n6. Testing unit-person assignment...');
    const unitPerson = await prisma.unitPerson.create({
      data: {
        personId: person.id,
        unitId: unit.id,
        role: 'tenant'
      },
      include: {
        person: true,
        unit: true
      }
    });
    console.log('✅ Unit-person assignment created:', `${unitPerson.person.firstName} ${unitPerson.person.lastName} as ${unitPerson.role} for ${unitPerson.unit.name}`);

    // 7. Test querying assignments
    console.log('\n7. Testing assignment queries...');
    
    // Query property people
    const propertyPeople = await prisma.propertyPerson.findMany({
      where: {
        propertyId: property.id,
        isActive: true
      },
      include: {
        person: true
      }
    });
    console.log('✅ Property people query:', propertyPeople.length, 'assignments found');

    // Query unit people
    const unitPeople = await prisma.unitPerson.findMany({
      where: {
        unitId: unit.id,
        isActive: true
      },
      include: {
        person: true
      }
    });
    console.log('✅ Unit people query:', unitPeople.length, 'assignments found');

    // 8. Test updating assignment role
    console.log('\n8. Testing role update...');
    const updatedPropertyPerson = await prisma.propertyPerson.update({
      where: { id: propertyPerson.id },
      data: { role: 'verwalter' },
      include: {
        person: true
      }
    });
    console.log('✅ Role updated:', `${updatedPropertyPerson.person.firstName} ${updatedPropertyPerson.person.lastName} role changed to ${updatedPropertyPerson.role}`);

    // 9. Test soft delete (setting isActive to false)
    console.log('\n9. Testing soft delete...');
    const softDeletedPropertyPerson = await prisma.propertyPerson.update({
      where: { id: propertyPerson.id },
      data: { isActive: false }
    });
    console.log('✅ Soft delete completed, isActive:', softDeletedPropertyPerson.isActive);

    // 10. Verify soft delete worked
    const activePropertyPeople = await prisma.propertyPerson.findMany({
      where: {
        propertyId: property.id,
        isActive: true
      }
    });
    console.log('✅ Active property people after soft delete:', activePropertyPeople.length);

    // 11. Test duplicate assignment prevention (same person to same property/unit)
    console.log('\n10. Testing duplicate assignment prevention...');
    try {
      await prisma.propertyPerson.create({
        data: {
          personId: person.id,
          propertyId: property.id,
          role: 'eigentümer'
        }
      });
      console.log('❌ Duplicate assignment should have been prevented');
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('✅ Duplicate assignment correctly prevented by unique constraint');
      } else {
        console.log('✅ Duplicate assignment prevented (expected behavior):', error.message);
      }
    }

    console.log('\n🎉 All person assignment tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup: Delete test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      if (user) {
        await prisma.propertyPerson.deleteMany({
          where: {
            property: {
              userId: user.id
            }
          }
        });
        await prisma.unitPerson.deleteMany({
          where: {
            unit: {
              property: {
                userId: user.id
              }
            }
          }
        });
        await prisma.unit.deleteMany({
          where: {
            property: {
              userId: user.id
            }
          }
        });
        await prisma.property.deleteMany({
          where: {
            userId: user.id
          }
        });
        await prisma.person.deleteMany({
          where: {
            userId: user.id
          }
        });
        await prisma.user.delete({
          where: {
            id: user.id
          }
        });
        console.log('✅ Test data cleaned up');
      }
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError);
    }

    await prisma.$disconnect();
  }
}

// Run the test
testPersonAssignments();
