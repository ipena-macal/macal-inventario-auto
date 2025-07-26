#!/bin/bash
set -e

# Detener procesos existentes
sudo pkill -f "node" || true
sudo pkill -f "server.js" || true
sudo pkill -f "macal" || true

# Instalar Node.js si no está instalado
if ! command -v node &> /dev/null; then
    curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# Crear directorio del backend
cd /home/ec2-user
rm -rf macal-backend
mkdir -p macal-backend
cd macal-backend

# Crear el servidor
cat > server.js << 'BACKEND'
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'macal-secret-2025';

const users = [
  { id: '1', email: 'admin@macal.cl', password: 'MacalAdmin2024', name: 'Administrador', role: 'admin' },
  { id: '2', email: 'leader@macal.cl', password: 'MacalAdmin2024', name: 'Líder López', role: 'leader' },
  { id: '3', email: 'inspector@macal.cl', password: 'MacalAdmin2024', name: 'Inspector García', role: 'inspector' },
  { id: '4', email: 'client@bank.cl', password: 'MacalAdmin2024', name: 'Banco Santander', role: 'client' }
];

const vehicles = [
  { id: '1', license_plate: 'GFKL-82', make: 'Toyota', model: 'Corolla', year: 2022, color: 'Blanco', mileage: 15000, status: 'completed' },
  { id: '2', license_plate: 'HXRT-93', make: 'Nissan', model: 'Versa', year: 2023, color: 'Negro', mileage: 8000, status: 'inspecting' },
  { id: '3', license_plate: 'JKLM-45', make: 'Chevrolet', model: 'Sail', year: 2021, color: 'Rojo', mileage: 22000, status: 'pending' },
  { id: '4', license_plate: 'MNOP-67', make: 'Hyundai', model: 'Accent', year: 2023, color: 'Azul', mileage: 5000, status: 'pending' }
];

const inspections = [
  { id: '1', vehicle_id: '1', license_plate: 'GFKL-82', make: 'Toyota', model: 'Corolla', inspector_name: 'Inspector García', type: 'entry', status: 'completed', created_at: new Date() }
];

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, password });
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    console.log('Login failed for:', email);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
  const permissions = {
    create_vehicles: user.role === 'admin' || user.role === 'leader',
    edit_vehicles: user.role === 'admin' || user.role === 'leader',
    delete_vehicles: user.role === 'admin',
    create_inspections: user.role === 'admin' || user.role === 'leader' || user.role === 'inspector',
    view_all_inspections: user.role === 'admin' || user.role === 'leader'
  };
  
  console.log('Login successful for:', user.email);
  res.json({
    token,
    user: { 
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions 
    }
  });
});

app.get('/api/v1/vehicles', (req, res) => {
  const { status } = req.query;
  let filtered = vehicles;
  if (status) {
    filtered = vehicles.filter(v => v.status === status);
  }
  res.json(filtered);
});

app.get('/api/v1/vehicles/:id', (req, res) => {
  const vehicle = vehicles.find(v => v.id === req.params.id);
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }
  res.json(vehicle);
});

app.get('/api/v1/inspections', (req, res) => {
  res.json(inspections);
});

// Catch all for debugging
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  res.status(404).json({ error: 'Route not found' });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log('MACAL Backend running on port ' + PORT);
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  POST /api/v1/auth/login');
  console.log('  GET  /api/v1/vehicles');
  console.log('  GET  /api/v1/vehicles/:id');
  console.log('  GET  /api/v1/inspections');
});
BACKEND

# Crear package.json
cat > package.json << 'PKG'
{
  "name": "macal-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "4.18.2",
    "cors": "2.8.5",
    "jsonwebtoken": "9.0.2"
  }
}
PKG

# Instalar dependencias
npm install

# Instalar PM2 si no está disponible
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

# Detener y eliminar procesos PM2 anteriores
pm2 stop all || true
pm2 delete all || true

# Iniciar con PM2
pm2 start server.js --name macal-backend
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user || true

# Abrir puerto en firewall
sudo iptables -I INPUT -p tcp --dport 3001 -j ACCEPT || true

# Verificar que esté funcionando
sleep 3
echo ""
echo "Verificando backend..."
if curl -s http://localhost:3001/health | grep -q "ok"; then
  echo "✅ Backend funcionando correctamente"
else
  echo "❌ Error: Backend no responde"
  pm2 logs macal-backend --lines 20
  exit 1
fi

echo ""
echo "Backend desplegado en: http://$EC2_IP:3001"
