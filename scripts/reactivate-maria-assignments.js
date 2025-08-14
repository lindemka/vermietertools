const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function reactivateMariaAssignments() {
  console.log('🔧 Reactivating Maria assignments...');
  
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
  
  // 2. Get Maria Müller
  console.log('👥 Getting Maria Müller...');
  const peopleResponse = await fetch('http://localhost:3003/api/people', {
    headers: { 'Cookie': cookies }
  });
  
  if (!peopleResponse.ok) {
    console.error('❌ Failed to get people');
    return;
  }
  
  const peopleData = await peopleResponse.json();
  const maria = peopleData.people.find(p => p.firstName === 'Maria' && p.lastName === 'Müller');
  
  if (!maria) {
    console.error('❌ Maria Müller not found');
    return;
  }
  
  console.log(`✅ Found Maria Müller: ${maria.id}`);
  
  // 3. Get WA12 property
  console.log('🏢 Getting WA12 property...');
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
  
  // 4. Reactivate property assignment (Hausmeister)
  console.log('🏢 Reactivating property assignment...');
  const propertyAssignmentResponse = await fetch(`http://localhost:3003/api/properties/${wa12.id}/people`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookies 
    },
    body: JSON.stringify({
      personId: maria.id,
      role: 'hausmeister'
    }),
  });
  
  if (propertyAssignmentResponse.ok) {
    console.log('✅ Property assignment reactivated');
  } else {
    console.log('⚠️ Property assignment already exists or failed');
  }
  
  // 5. Get units for WA12
  console.log('🏠 Getting units for WA12...');
  const unitsResponse = await fetch(`http://localhost:3003/api/properties/${wa12.id}`, {
    headers: { 'Cookie': cookies }
  });
  
  if (!unitsResponse.ok) {
    console.error('❌ Failed to get units');
    return;
  }
  
  const propertyData = await unitsResponse.json();
  const unit2OG = propertyData.units.find(u => u.name === '2.OG links');
  
  if (unit2OG) {
    console.log(`✅ Found 2.OG links unit: ${unit2OG.id}`);
    
    // 6. Reactivate unit assignment (Mieter)
    console.log('🏠 Reactivating unit assignment...');
    const unitAssignmentResponse = await fetch(`http://localhost:3003/api/units/${unit2OG.id}/people`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies 
      },
      body: JSON.stringify({
        personId: maria.id,
        role: 'mieter'
      }),
    });
    
    if (unitAssignmentResponse.ok) {
      console.log('✅ Unit assignment reactivated');
    } else {
      console.log('⚠️ Unit assignment already exists or failed');
    }
  } else {
    console.log('❌ 2.OG links unit not found');
  }
  
  // 7. Verify the assignments
  console.log('\n🔍 Verifying assignments...');
  const verifyResponse = await fetch('http://localhost:3003/api/people', {
    headers: { 'Cookie': cookies }
  });
  
  if (verifyResponse.ok) {
    const verifyData = await verifyResponse.json();
    const verifyMaria = verifyData.people.find(p => p.firstName === 'Maria' && p.lastName === 'Müller');
    
    if (verifyMaria) {
      console.log(`✅ Maria has ${verifyMaria.propertyRoles.length} property roles and ${verifyMaria.unitRoles.length} unit roles`);
      
      verifyMaria.propertyRoles.forEach(role => {
        console.log(`   Property: ${role.property.name} (${role.role})`);
      });
      
      verifyMaria.unitRoles.forEach(role => {
        console.log(`   Unit: ${role.unit.name} in ${role.unit.property.name} (${role.role})`);
      });
    }
  }
  
  console.log('🎉 Reactivation completed!');
}

reactivateMariaAssignments().catch(console.error);
