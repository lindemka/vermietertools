const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function createPropertyAssignment() {
  try {
    // First, login to get session
    console.log('🔐 Logging in...');
    const loginResponse = await fetch('http://localhost:3003/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');

    // Get all people to find Maria Müller
    console.log('\n👥 Getting people...');
    const peopleResponse = await fetch('http://localhost:3003/api/people', {
      headers: { 'Cookie': cookies }
    });

    if (!peopleResponse.ok) {
      console.error('❌ Failed to get people:', await peopleResponse.text());
      return;
    }

    const people = await peopleResponse.json();
    const maria = people.people.find(p => p.firstName === 'Maria' && p.lastName === 'Müller');
    
    if (!maria) {
      console.error('❌ Maria Müller not found');
      return;
    }

    console.log(`✅ Found Maria Müller: ${maria.id}`);

    // Get properties to find WA12
    console.log('\n🏢 Getting properties...');
    const propertiesResponse = await fetch('http://localhost:3003/api/properties', {
      headers: { 'Cookie': cookies }
    });

    if (!propertiesResponse.ok) {
      console.error('❌ Failed to get properties:', await propertiesResponse.text());
      return;
    }

    const properties = await propertiesResponse.json();
    const wa12 = properties.properties.find(p => p.name === 'WA12');
    
    if (!wa12) {
      console.error('❌ Property WA12 not found');
      return;
    }

    console.log(`✅ Found WA12: ${wa12.id}`);

    // Assign Maria to WA12 as Hausmeister
    console.log('\n🔗 Assigning Maria to WA12 as Hausmeister...');
    const assignmentResponse = await fetch(`http://localhost:3003/api/properties/${wa12.id}/people`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        personId: maria.id,
        role: 'hausmeister'
      })
    });

    if (!assignmentResponse.ok) {
      console.error('❌ Failed to assign person:', await assignmentResponse.text());
      return;
    }

    console.log('✅ Assignment successful!');

    // Verify the assignment
    console.log('\n🔍 Verifying assignment...');
    const verifyResponse = await fetch(`http://localhost:3003/api/properties/${wa12.id}/people`, {
      headers: { 'Cookie': cookies }
    });

    if (verifyResponse.ok) {
      const assignments = await verifyResponse.json();
      console.log(`📋 Property people: ${assignments.length}`);
      assignments.forEach(assignment => {
        console.log(`   - ${assignment.person.firstName} ${assignment.person.lastName} (${assignment.role})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createPropertyAssignment();
