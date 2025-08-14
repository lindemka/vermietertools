const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDuplicatePeople() {
  try {
    console.log('🔍 Checking for duplicate people...\n');

    // Get all people for the test@example.com user
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      console.log('❌ test@example.com user not found');
      return;
    }

    console.log(`👤 Checking people for user: ${testUser.email} (${testUser.id})\n`);

    const people = await prisma.person.findMany({
      where: { userId: testUser.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        isActive: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    console.log(`📊 Found ${people.length} total people\n`);

    // Group by name and email to find duplicates
    const groups = {};
    
    people.forEach(person => {
      const key = `${person.firstName}-${person.lastName}-${person.email}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(person);
    });

    // Show duplicates
    let hasDuplicates = false;
    Object.entries(groups).forEach(([key, group]) => {
      if (group.length > 1) {
        hasDuplicates = true;
        console.log(`🔄 DUPLICATE GROUP: ${key}`);
        group.forEach((person, index) => {
          console.log(`  ${index + 1}. ID: ${person.id}`);
          console.log(`     Name: ${person.firstName} ${person.lastName}`);
          console.log(`     Email: ${person.email}`);
          console.log(`     Phone: ${person.phone}`);
          console.log(`     Created: ${person.createdAt.toLocaleString()}`);
          console.log(`     Active: ${person.isActive}`);
          console.log('');
        });
      }
    });

    if (!hasDuplicates) {
      console.log('✅ No duplicates found');
    }

    // Show unique people
    console.log('📋 UNIQUE PEOPLE:');
    Object.entries(groups).forEach(([key, group]) => {
      const person = group[0]; // Take the first one
      console.log(`- ${person.firstName} ${person.lastName} (${person.email})`);
    });

  } catch (error) {
    console.error('❌ Error checking duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicatePeople();
