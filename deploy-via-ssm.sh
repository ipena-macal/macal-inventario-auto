#!/bin/bash
set -e

echo "=== Deploying MACAL Backend via AWS SSM ==="

INSTANCE_ID="i-09bb7ca5173ff79b1"
REGION="us-east-2"

# Create the backend script
cat > backend-setup.sh << 'EOF'
#!/bin/bash
set -e

# Stop existing services
echo "Stopping existing services..."
sudo pkill -f "node" || true
sleep 2

# Install Node.js if needed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Create backend directory
mkdir -p /home/ec2-user/backend
cd /home/ec2-user/backend

# Create package.json
cat > package.json << 'PKGJSON'
{
  "name": "macal-backend",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.2"
  }
}
PKGJSON

# Install dependencies
npm install

# Create backend server
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
BACKEND

# Start with PM2
echo "Starting backend with PM2..."
pm2 stop macal-backend || true
pm2 delete macal-backend || true
pm2 start server.js --name macal-backend
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user || true

# Configure firewall
sudo iptables -I INPUT -p tcp --dport 3001 -j ACCEPT || true

echo "Backend deployed!"
curl -s http://localhost:3001/health
EOF

# Send command via SSM
echo "Sending deployment command to EC2 instance..."
COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --region "$REGION" \
    --parameters 'commands=["'"$(cat backend-setup.sh | sed 's/"/\\"/g' | tr '\n' ' ')"'"]' \
    --output text \
    --query Command.CommandId)

echo "Command ID: $COMMAND_ID"
echo "Waiting for command to complete..."

# Wait for command completion
sleep 5
aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --region "$REGION"

# Update frontend
echo "Updating frontend..."
cd frontend
sed -i '' "s|http://localhost:3001|http://3.148.227.249:3001|g" src/lib/axios.ts

# Build frontend
echo "Building frontend..."
npm run build

echo ""
echo "=== Backend Deployed ==="
echo "Backend URL: http://3.148.227.249:3001"
echo ""
echo "Test with:"
echo "curl http://3.148.227.249:3001/health"
echo ""
echo "To deploy frontend to S3, run:"
echo "aws s3 sync frontend/dist/ s3://your-bucket-name"

# Cleanup
rm -f backend-setup.sh