const http = require('http');

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = req.url;
  console.log(`${new Date().toISOString()} - ${req.method} ${url}`);
  
  if (url === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date() }));
  } 
  else if (url === '/api/v1/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.email === 'admin@macal.cl' && data.password === 'MacalAdmin2024') {
          res.writeHead(200);
          res.end(JSON.stringify({
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6ImFkbWluQG1hY2FsLmNsIiwicm9sZSI6ImFkbWluIn0.test',
            user: {
              id: '1',
              email: 'admin@macal.cl',
              name: 'Administrador',
              role: 'admin',
              permissions: {
                create_vehicles: true,
                edit_vehicles: true,
                delete_vehicles: true,
                create_inspections: true,
                view_all_inspections: true
              }
            }
          }));
        } else {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
        }
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  }
  else if (url === '/api/v1/vehicles' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify([
      { id: '1', license_plate: 'GFKL-82', make: 'Toyota', model: 'Corolla', year: 2022, color: 'Blanco', mileage: 15000, status: 'completed' },
      { id: '2', license_plate: 'HXRT-93', make: 'Nissan', model: 'Versa', year: 2023, color: 'Negro', mileage: 8000, status: 'inspecting' }
    ]));
  }
  else if (url.startsWith('/api/v1/vehicles/') && req.method === 'GET') {
    const id = url.split('/').pop();
    if (id === '1') {
      res.writeHead(200);
      res.end(JSON.stringify({ id: '1', license_plate: 'GFKL-82', make: 'Toyota', model: 'Corolla', year: 2022, color: 'Blanco', mileage: 15000, status: 'completed' }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Vehicle not found' }));
    }
  }
  else if (url === '/api/v1/inspections' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify([]));
  }
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(3001, '0.0.0.0', () => {
  console.log('Emergency backend running on port 3001');
});
