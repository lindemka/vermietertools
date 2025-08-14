const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkInactiveAssignments() {
  try {
    console.log('🔍 Checking inactive assignments...\n');

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

    // Get ALL property assignments (including inactive ones)
    const allPropertyAssignments = await prisma.propertyPerson.findMany({
      where: {
        personId: johnDoe.id
      },
      include: {
        property: true
      }
    });

    console.log('🏢 ALL Property Assignments (including inactive):');
    allPropertyAssignments.forEach(assignment => {
      console.log(`  - ${assignment.property.name} (${assignment.property.id}) - ${assignment.role} - Active: ${assignment.isActive}`);
    });

    // Get ALL unit assignments (including inactive ones)
    const allUnitAssignments = await prisma.unitPerson.findMany({
      where: {
        personId: johnDoe.id
      },
      include: {
        unit: {
          include: {
            property: true
          }
        }
      }
    });

    console.log('\n🏠 ALL Unit Assignments (including inactive):');
    allUnitAssignments.forEach(assignment => {
      console.log(`  - ${assignment.unit.name} (${assignment.unit.id}) - ${assignment.unit.property.name} - ${assignment.role} - Active: ${assignment.isActive}`);
    });

    // Get only ACTIVE property assignments
    const activePropertyAssignments = await prisma.propertyPerson.findMany({
      where: {
        personId: johnDoe.id,
        isActive: true
      },
      include: {
        property: true
      }
    });

    console.log('\n✅ ACTIVE Property Assignments:');
    activePropertyAssignments.forEach(assignment => {
      console.log(`  - ${assignment.property.name} (${assignment.property.id}) - ${assignment.role}`);
    });

    // Get only ACTIVE unit assignments
    const activeUnitAssignments = await prisma.unitPerson.findMany({
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

    console.log('\n✅ ACTIVE Unit Assignments:');
    activeUnitAssignments.forEach(assignment => {
      console.log(`  - ${assignment.unit.name} (${assignment.unit.id}) - ${assignment.unit.property.name} - ${assignment.role}`);
    });

    console.log(`\n📊 Summary:`);
    console.log(`- Total property assignments: ${allPropertyAssignments.length}`);
    console.log(`- Active property assignments: ${activePropertyAssignments.length}`);
    console.log(`- Total unit assignments: ${allUnitAssignments.length}`);
    console.log(`- Active unit assignments: ${activeUnitAssignments.length}`);

  } catch (error) {
    console.error('❌ Error checking assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInactiveAssignments();
