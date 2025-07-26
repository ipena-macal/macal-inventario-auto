#!/bin/bash
set -e

echo "=== Direct Deploy to AWS ==="

# First, update frontend to point to EC2
cd frontend
sed -i '' "s|http://localhost:3001|http://3.148.227.249:3001|g" src/lib/axios.ts

# Build frontend
echo "Building frontend..."
npm run build || npx vite build

cd ..

# Create simple backend deployment script
cat > ec2-deploy.sh << 'EOF'
#!/bin/bash
sudo pkill -f "node" || true
sudo pkill -f "server.js" || true

cd /home/ec2-user
rm -rf simple-backend
mkdir -p simple-backend
cd simple-backend

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
  res.json(vehicles);
});

app.get('/api/v1/vehicles/:id', (req, res) => {
  const vehicle = vehicles.find(v => v.id === req.params.id);
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }
  res.json(vehicle);
});

app.get('/api/v1/inspections', (req, res) => {
  res.json([]);
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Backend running on port ' + PORT);
});
BACKEND

npm init -y
npm install express@4 cors jsonwebtoken

# Run with nohup
nohup node server.js > backend.log 2>&1 &

sleep 2
curl http://localhost:3001/health
EOF

echo "Script created. Now deploying to EC2..."
echo ""
echo "COPY AND RUN THIS ON EC2:"
echo "========================="
cat ec2-deploy.sh
echo "========================="
echo ""
echo "Once backend is deployed, frontend will be available at http://localhost:8080"
echo "Or deploy to S3 with: aws s3 sync frontend/dist/ s3://your-bucket-name"