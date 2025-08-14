const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicatePeople() {
  try {
    console.log('🧹 Cleaning up duplicate people...\n');

    // Get all people for the test@example.com user
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      console.log('❌ test@example.com user not found');
      return;
    }

    console.log(`👤 Cleaning up people for user: ${testUser.email}\n`);

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
        { createdAt: 'desc' } // Newest first
      ]
    });

    // Group by name and email to find duplicates
    const groups = {};
    
    people.forEach(person => {
      const key = `${person.firstName}-${person.lastName}-${person.email}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(person);
    });

    // Keep only the newest version of each person
    const peopleToKeep = [];
    const peopleToDelete = [];

    Object.entries(groups).forEach(([key, group]) => {
      if (group.length > 1) {
        // Keep the newest one (first in the array since we sorted by createdAt desc)
        peopleToKeep.push(group[0]);
        // Mark the rest for deletion
        peopleToDelete.push(...group.slice(1));
        console.log(`🔄 Found duplicates for ${key}:`);
        console.log(`  ✅ Keeping: ${group[0].firstName} ${group[0].lastName} (${group[0].id})`);
        group.slice(1).forEach(person => {
          console.log(`  🗑️  Deleting: ${person.firstName} ${person.lastName} (${person.id})`);
        });
      } else {
        // No duplicates, keep the single person
        peopleToKeep.push(group[0]);
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`- Total people: ${people.length}`);
    console.log(`- People to keep: ${peopleToKeep.length}`);
    console.log(`- People to delete: ${peopleToDelete.length}`);

    if (peopleToDelete.length === 0) {
      console.log('✅ No duplicates to clean up');
      return;
    }

    // Delete the duplicate people
    console.log('\n🗑️  Deleting duplicate people...');
    
    for (const person of peopleToDelete) {
      try {
        // First, delete any assignments for this person
        await prisma.propertyPerson.deleteMany({
          where: { personId: person.id }
        });
        
        await prisma.unitPerson.deleteMany({
          where: { personId: person.id }
        });
        
        // Then delete the person
        await prisma.person.delete({
          where: { id: person.id }
        });
        
        console.log(`✅ Deleted: ${person.firstName} ${person.lastName} (${person.id})`);
      } catch (error) {
        console.error(`❌ Error deleting ${person.firstName} ${person.lastName}:`, error.message);
      }
    }

    console.log('\n✅ Cleanup completed!');

    // Show final result
    const finalPeople = await prisma.person.findMany({
      where: { userId: testUser.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      },
      orderBy: { lastName: 'asc' }
    });

    console.log('\n📋 Final people list:');
    finalPeople.forEach(person => {
      console.log(`- ${person.firstName} ${person.lastName} (${person.email})`);
    });

  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicatePeople();
