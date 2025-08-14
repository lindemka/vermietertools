const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserDetails() {
  try {
    console.log('🔍 Checking user details...\n');

    // Find the user who owns John Doe
    const johnDoeUser = await prisma.user.findFirst({
      where: {
        people: {
          some: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (johnDoeUser) {
      console.log('👤 User who owns John Doe:');
      console.log(`- ID: ${johnDoeUser.id}`);
      console.log(`- Email: ${johnDoeUser.email}`);
      console.log(`- Name: ${johnDoeUser.name}`);
    } else {
      console.log('❌ No user found who owns John Doe');
    }

    // Check test@example.com user
    const testUser = await prisma.user.findUnique({
      where: {
        email: 'test@example.com'
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (testUser) {
      console.log('\n👤 test@example.com user:');
      console.log(`- ID: ${testUser.id}`);
      console.log(`- Email: ${testUser.email}`);
      console.log(`- Name: ${testUser.name}`);
    } else {
      console.log('\n❌ test@example.com user not found');
    }

    // Check all users
    console.log('\n👥 ALL USERS:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - ID: ${user.id}`);
    });

  } catch (error) {
    console.error('❌ Error checking user details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserDetails();
