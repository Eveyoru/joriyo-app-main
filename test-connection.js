const fetch = require('node-fetch');

async function testConnection() {
  const url = 'http://192.168.1.6:8080/health';
  console.log('Testing connection to:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      timeout: 5000 // 5 second timeout
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testConnection();
