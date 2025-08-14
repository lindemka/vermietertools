const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugPropertyPeopleData() {
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

    // Get property people data
    console.log('\n👥 Getting property people data...');
    const peopleResponse = await fetch(`http://localhost:3003/api/properties/${wa12.id}/people`, {
      headers: { 'Cookie': cookies }
    });

    if (!peopleResponse.ok) {
      console.error('❌ Failed to get property people:', await peopleResponse.text());
      return;
    }

    const propertyPeople = await peopleResponse.json();
    console.log(`📋 Property people count: ${propertyPeople.length}`);
    
    propertyPeople.forEach((propertyPerson, index) => {
      console.log(`\n👤 Property Person ${index + 1}:`);
      console.log(`   PropertyPerson ID: ${propertyPerson.id}`);
      console.log(`   Role: ${propertyPerson.role}`);
      console.log(`   Person ID: ${propertyPerson.person.id}`);
      console.log(`   Person Name: ${propertyPerson.person.firstName} ${propertyPerson.person.lastName}`);
      console.log(`   Person Email: ${propertyPerson.person.email || 'N/A'}`);
      console.log(`   Person Phone: ${propertyPerson.person.phone || 'N/A'}`);
      console.log(`   Person Notes: ${propertyPerson.person.notes || 'N/A'}`);
      console.log(`   Person isActive: ${propertyPerson.person.isActive}`);
      console.log(`   Person createdAt: ${propertyPerson.person.createdAt}`);
      console.log(`   Person updatedAt: ${propertyPerson.person.updatedAt}`);
    });

    // Also get the same person from the general people API for comparison
    console.log('\n🔍 Getting Maria Müller from general people API for comparison...');
    const allPeopleResponse = await fetch('http://localhost:3003/api/people', {
      headers: { 'Cookie': cookies }
    });

    if (allPeopleResponse.ok) {
      const allPeople = await allPeopleResponse.json();
      const maria = allPeople.people.find(p => p.firstName === 'Maria' && p.lastName === 'Müller');
      
      if (maria) {
        console.log('\n👤 Maria Müller from general people API:');
        console.log(`   Person ID: ${maria.id}`);
        console.log(`   Person Name: ${maria.firstName} ${maria.lastName}`);
        console.log(`   Person Email: ${maria.email || 'N/A'}`);
        console.log(`   Person Phone: ${maria.phone || 'N/A'}`);
        console.log(`   Person Notes: ${maria.notes || 'N/A'}`);
        console.log(`   Person isActive: ${maria.isActive}`);
        console.log(`   Person createdAt: ${maria.createdAt}`);
        console.log(`   Person updatedAt: ${maria.updatedAt}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugPropertyPeopleData();
