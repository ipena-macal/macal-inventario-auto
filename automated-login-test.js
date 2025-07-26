const axios = require('axios');

async function completeLoginFlow() {
  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'admin@macal.cl',
      password: 'MacalAdmin2024'
    });
    
    const { token, user } = loginResponse.data;
    console.log('✓ Login successful!');
    console.log('  User:', user.name, `(${user.role})`);
    console.log('  Token:', token.substring(0, 50) + '...');
    
    // 2. Get vehicles
    console.log('\n2. Fetching vehicles...');
    const vehiclesResponse = await axios.get('http://localhost:3001/api/v1/vehicles', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✓ Vehicles fetched:', vehiclesResponse.data.length, 'vehicles');
    vehiclesResponse.data.forEach(v => {
      console.log(`  - ${v.license_plate}: ${v.make} ${v.model} (${v.status})`);
    });
    
    // 3. Get specific vehicle
    if (vehiclesResponse.data.length > 0) {
      console.log('\n3. Fetching vehicle details...');
      const vehicleId = vehiclesResponse.data[0].id;
      const vehicleResponse = await axios.get(`http://localhost:3001/api/v1/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✓ Vehicle details:');
      console.log('  ', JSON.stringify(vehicleResponse.data, null, 2));
    }
    
    console.log('\n✅ All tests passed! The backend is working correctly.');
    console.log('\nYou can now open http://localhost:3000 and login with:');
    console.log('Email: admin@macal.cl');
    console.log('Password: MacalAdmin2024');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

completeLoginFlow();