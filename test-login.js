const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'admin@macal.cl',
      password: 'MacalAdmin2024'
    });
    
    console.log('Login successful!');
    console.log('Token:', response.data.token);
    console.log('User:', response.data.user);
    
    // Test authenticated request
    const vehiclesResponse = await axios.get('http://localhost:3001/api/v1/vehicles', {
      headers: {
        Authorization: `Bearer ${response.data.token}`
      }
    });
    
    console.log('\nVehicles:', vehiclesResponse.data);
    
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
  }
}

testLogin();