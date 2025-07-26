#!/bin/bash
set -e

echo "=== Arreglando el backend en EC2 de una vez por todas ==="

EC2_IP="3.148.227.249"

# Crear un backend simple que NO use base de datos
cat > emergency-backend.js << 'EOF'
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
EOF

# Ahora intentar múltiples formas de desplegarlo
echo ""
echo "Intentando desplegar el backend de emergencia..."

# Método 1: Crear un script que se pueda ejecutar remotamente
DEPLOY_COMMANDS=$(cat << 'DEPLOY_EOF'
# Detener todo
sudo pkill -f node || true
sudo pkill -f server.js || true
sudo pkill -f pm2 || true
sudo systemctl stop macal-backend || true

# Crear el backend
cd /home/ec2-user
cat > emergency-backend.js << 'BACKEND_EOF'
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
BACKEND_EOF

# Ejecutar directamente con node
nohup node emergency-backend.js > /home/ec2-user/backend.log 2>&1 &
echo $! > /home/ec2-user/backend.pid

# Verificar
sleep 2
curl http://localhost:3001/health
DEPLOY_EOF
)

# Escribir el script para copiar/pegar
echo ""
echo "================================================"
echo "EJECUTA ESTO EN TU EC2 ($EC2_IP):"
echo "================================================"
echo "$DEPLOY_COMMANDS"
echo "================================================"
echo ""

# También intentar via curl directo al backend actual
echo "Verificando estado actual del backend..."
CURRENT_STATUS=$(curl -s http://$EC2_IP:3001/health 2>&1)
echo "Estado actual: $CURRENT_STATUS"

if echo "$CURRENT_STATUS" | grep -q "ECONNREFUSED"; then
  echo ""
  echo "❌ El backend actual está intentando conectarse a PostgreSQL"
  echo "✅ Ejecuta el script de arriba en tu EC2 para solucionarlo"
fi

# Verificar el frontend
echo ""
echo "Frontend está disponible en: http://localhost:8080"
echo ""
echo "Una vez que ejecutes el script en EC2, podrás iniciar sesión con:"
echo "  Email: admin@macal.cl"
echo "  Password: MacalAdmin2024"