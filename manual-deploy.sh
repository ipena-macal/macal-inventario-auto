#!/bin/bash

echo "=== Manual Deploy Instructions ==="
echo ""
echo "1. First, update the frontend to point to EC2:"
echo ""

# Update frontend
cd frontend
sed -i '' "s|http://localhost:3001|http://3.148.227.249:3001|g" src/lib/axios.ts
echo "✓ Frontend updated to use EC2 backend"

# Build frontend
echo ""
echo "2. Building frontend..."
npm run build
echo "✓ Frontend built successfully"

echo ""
echo "3. Copy and paste this command in your EC2 instance:"
echo ""
echo "================================================"
cat << 'DEPLOY_SCRIPT'
# Run this on your EC2 instance (3.148.227.249)

# Stop any existing Node processes
sudo pkill -f node || true

# Install Node.js if needed
if ! command -v node &> /dev/null; then
    curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# Create backend directory
mkdir -p ~/backend && cd ~/backend

# Create package.json
cat > package.json << 'EOF'
{
  "name": "macal-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.2"
  }
}
EOF

# Install dependencies
npm install

# Create the backend server
cat > server.js << 'EOF'
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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
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

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Backend running on port ' + PORT);
});
EOF

# Start the server
nohup node server.js > backend.log 2>&1 &
echo "Backend started!"

# Test it
sleep 2
curl http://localhost:3001/health

DEPLOY_SCRIPT
echo "================================================"
echo ""
echo "4. Once backend is running on EC2, deploy frontend:"
echo "   - Upload the contents of frontend/dist/ to your S3 bucket"
echo "   - Or use: aws s3 sync frontend/dist/ s3://your-bucket-name"
echo ""
echo "Frontend files are ready in: frontend/dist/"
echo ""
echo "Login credentials:"
echo "  Email: admin@macal.cl"
echo "  Password: MacalAdmin2024"