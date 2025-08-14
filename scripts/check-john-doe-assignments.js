const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkJohnDoeAssignments() {
  try {
    console.log('🔍 Checking John Doe assignments...\n');

    // Get the test user
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      console.log('❌ test@example.com user not found');
      return;
    }

    console.log(`👤 Checking assignments for user: ${testUser.email}\n`);

    // Find John Doe
    const johnDoe = await prisma.person.findFirst({
      where: {
        userId: testUser.id,
        firstName: 'John',
        lastName: 'Doe',
        isActive: true
      }
    });

    if (!johnDoe) {
      console.log('❌ John Doe not found');
      return;
    }

    console.log(`✅ Found John Doe: ${johnDoe.id}\n`);

    // Get all properties for the user
    const properties = await prisma.property.findMany({
      where: {
        userId: testUser.id,
        isActive: true
      },
      include: {
        units: {
          where: { isActive: true }
        }
      }
    });

    console.log('📋 Properties:');
    properties.forEach(property => {
      console.log(`  - ${property.name} (${property.id})`);
      property.units.forEach(unit => {
        console.log(`    └─ ${unit.name} (${unit.id})`);
      });
    });

    // Get property assignments
    const propertyAssignments = await prisma.propertyPerson.findMany({
      where: {
        personId: johnDoe.id,
        isActive: true
      },
      include: {
        property: true
      }
    });

    console.log('\n🏢 Property Assignments:');
    propertyAssignments.forEach(assignment => {
      console.log(`  - ${assignment.property.name} (${assignment.property.id}) - ${assignment.role}`);
    });

    // Get unit assignments
    const unitAssignments = await prisma.unitPerson.findMany({
      where: {
        personId: johnDoe.id,
        isActive: true
      },
      include: {
        unit: {
          include: {
            property: true
          }
        }
      }
    });

    console.log('\n🏠 Unit Assignments:');
    unitAssignments.forEach(assignment => {
      console.log(`  - ${assignment.unit.name} (${assignment.unit.id}) - ${assignment.unit.property.name} - ${assignment.role}`);
    });

    console.log(`\n📊 Summary:`);
    console.log(`- Property assignments: ${propertyAssignments.length}`);
    console.log(`- Unit assignments: ${unitAssignments.length}`);
    console.log(`- Total assignments: ${propertyAssignments.length + unitAssignments.length}`);

  } catch (error) {
    console.error('❌ Error checking assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkJohnDoeAssignments();
