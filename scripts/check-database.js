const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...\n');

    // Check users
    console.log('👥 USERS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach(user => {
        console.log(`- ${user.email} (${user.name}) - Created: ${user.createdAt.toLocaleDateString()}`);
      });
    }

    console.log('\n👤 PEOPLE:');
    const people = await prisma.person.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userId: true
      }
    });
    
    if (people.length === 0) {
      console.log('❌ No people found in database');
    } else {
      people.forEach(person => {
        console.log(`- ${person.firstName} ${person.lastName} (${person.email}) - User ID: ${person.userId}`);
      });
    }

    console.log('\n🏠 PROPERTIES:');
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        userId: true
      }
    });
    
    if (properties.length === 0) {
      console.log('❌ No properties found in database');
    } else {
      properties.forEach(property => {
        console.log(`- ${property.name} (${property.address}) - User ID: ${property.userId}`);
      });
    }

    console.log('\n🏢 UNITS:');
    const units = await prisma.unit.findMany({
      select: {
        id: true,
        name: true,
        propertyId: true
      }
    });
    
    if (units.length === 0) {
      console.log('❌ No units found in database');
    } else {
      units.forEach(unit => {
        console.log(`- ${unit.name} - Property ID: ${unit.propertyId}`);
      });
    }

    console.log('\n🔗 PROPERTY ASSIGNMENTS:');
    const propertyAssignments = await prisma.propertyPerson.findMany({
      select: {
        id: true,
        personId: true,
        propertyId: true,
        role: true
      }
    });
    
    if (propertyAssignments.length === 0) {
      console.log('❌ No property assignments found in database');
    } else {
      propertyAssignments.forEach(assignment => {
        console.log(`- Person ${assignment.personId} -> Property ${assignment.propertyId} (${assignment.role})`);
      });
    }

    console.log('\n🔗 UNIT ASSIGNMENTS:');
    const unitAssignments = await prisma.unitPerson.findMany({
      select: {
        id: true,
        personId: true,
        unitId: true,
        role: true
      }
    });
    
    if (unitAssignments.length === 0) {
      console.log('❌ No unit assignments found in database');
    } else {
      unitAssignments.forEach(assignment => {
        console.log(`- Person ${assignment.personId} -> Unit ${assignment.unitId} (${assignment.role})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
