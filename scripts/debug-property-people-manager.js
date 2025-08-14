const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugPropertyPeopleManager() {
  console.log('🔍 Debugging PropertyPeopleManager...');
  
  // 1. Login
  console.log('🔐 Logging in...');
  const loginResponse = await fetch('http://localhost:3003/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
  });
  
  if (!loginResponse.ok) {
    console.error('❌ Login failed');
    return;
  }
  
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Login successful');
  
  // 2. Get all people
  console.log('👥 Getting all people...');
  const peopleResponse = await fetch('http://localhost:3003/api/people', {
    headers: { 'Cookie': cookies }
  });
  
  if (!peopleResponse.ok) {
    console.error('❌ Failed to get people');
    return;
  }
  
  const peopleData = await peopleResponse.json();
  console.log(`📊 Found ${peopleData.people.length} people`);
  
  // 3. Find Maria Müller
  const maria = peopleData.people.find(p => p.firstName === 'Maria' && p.lastName === 'Müller');
  if (!maria) {
    console.error('❌ Maria Müller not found');
    return;
  }
  
  console.log('✅ Found Maria Müller:');
  console.log(`   ID: ${maria.id}`);
  console.log(`   Property Roles: ${maria.propertyRoles.length}`);
  console.log(`   Unit Roles: ${maria.unitRoles.length}`);
  
  // 4. Check her assignments
  console.log('\n🏢 Property Roles:');
  maria.propertyRoles.forEach(role => {
    console.log(`   - ${role.property.name} (${role.role})`);
  });
  
  console.log('\n🏠 Unit Roles:');
  maria.unitRoles.forEach(role => {
    console.log(`   - ${role.unit.name} in ${role.unit.property.name} (${role.role})`);
  });
  
  // 5. Get WA12 property ID
  console.log('\n🏢 Getting WA12 property...');
  const propertiesResponse = await fetch('http://localhost:3003/api/properties', {
    headers: { 'Cookie': cookies }
  });
  
  if (!propertiesResponse.ok) {
    console.error('❌ Failed to get properties');
    return;
  }
  
  const propertiesData = await propertiesResponse.json();
  const wa12 = propertiesData.properties.find(p => p.name === 'WA12');
  
  if (!wa12) {
    console.error('❌ WA12 property not found');
    return;
  }
  
  console.log(`✅ Found WA12: ${wa12.id}`);
  
  // 6. Filter people for WA12 (like PropertyPeopleManager does)
  console.log('\n🔍 Filtering people for WA12...');
  const filteredPeople = peopleData.people.filter(person => {
    const hasPropertyRole = person.propertyRoles.some(role => role.property.id === wa12.id);
    const hasUnitRole = person.unitRoles.some(role => role.unit.property.id === wa12.id);
    return hasPropertyRole || hasUnitRole;
  });
  
  console.log(`📊 Filtered people count: ${filteredPeople.length}`);
  
  filteredPeople.forEach(person => {
    console.log(`\n👤 ${person.firstName} ${person.lastName}:`);
    
    const propertyRoles = person.propertyRoles.filter(role => role.property.id === wa12.id);
    const unitRoles = person.unitRoles.filter(role => role.unit.property.id === wa12.id);
    
    if (propertyRoles.length > 0) {
      console.log('   Property Roles:');
      propertyRoles.forEach(role => {
        console.log(`     - ${role.property.name} (${role.role})`);
      });
    }
    
    if (unitRoles.length > 0) {
      console.log('   Unit Roles:');
      unitRoles.forEach(role => {
        console.log(`     - ${role.unit.name} (${role.role})`);
      });
    }
  });
}

debugPropertyPeopleManager().catch(console.error);
