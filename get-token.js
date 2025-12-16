const axios = require('axios');

async function login() {
  try {
    const response = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'sameer@test.com',
      password: 'test123'
    });
    console.log('\n=== NEW JWT TOKEN ===');
    console.log(response.data.token);
    console.log('===================\n');
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
  }
}

login();
