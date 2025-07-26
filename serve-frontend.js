const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}`);
  console.log('');
  console.log('Make sure the backend is deployed to EC2 first!');
  console.log('Backend should be at: http://3.148.227.249:3001');
  console.log('');
  console.log('Login credentials:');
  console.log('  Email: admin@macal.cl');
  console.log('  Password: MacalAdmin2024');
});