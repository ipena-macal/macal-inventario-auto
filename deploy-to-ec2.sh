#!/bin/bash
set -e

echo "=== Deploying MACAL Inventory to AWS EC2 ==="

# Variables
EC2_IP="3.148.227.249"
KEY_PATH="./macal-inventory-key.pem"

# Set permissions on key
chmod 400 "$KEY_PATH"

# Create deployment package
echo "Creating deployment package..."
cat > deploy-package.sh << 'EOF'
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

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Setup backend directory
echo "Setting up backend..."
mkdir -p /home/ec2-user/backend
cd /home/ec2-user/backend

# Create package.json
cat > package.json << 'PKGJSON'
{
  "name": "macal-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.2"
  }
}
PKGJSON

# Install dependencies
npm install

# Create the working backend
cat > server.js << 'BACKEND'
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'macal-secret-2025';

// Mock data
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

// Routes
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
  console.log(`Backend running on port ${PORT}`);
});
BACKEND

# Start with PM2
echo "Starting backend with PM2..."
pm2 stop macal-backend || true
pm2 delete macal-backend || true
pm2 start server.js --name macal-backend
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user || true

# Open port 3001 if needed
echo "Configuring firewall..."
sudo iptables -I INPUT -p tcp --dport 3001 -j ACCEPT || true

echo "Backend deployment complete!"
echo "Testing backend..."
curl -s http://localhost:3001/health || echo "Health check failed"
EOF

# Copy and execute deployment script
echo "Copying deployment script to EC2..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no deploy-package.sh ec2-user@$EC2_IP:/home/ec2-user/

echo "Executing deployment on EC2..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$EC2_IP "chmod +x deploy-package.sh && ./deploy-package.sh"

# Update frontend to point to EC2
echo "Updating frontend configuration..."
cd frontend
sed -i '' "s|http://localhost:3001|http://$EC2_IP:3001|g" src/lib/axios.ts || true

# Build frontend
echo "Building frontend..."
npm run build

# Deploy frontend to S3
echo "Deploying frontend to S3..."
BUCKET_NAME="macal-inventory-frontend-$(date +%s)"
aws s3 mb s3://$BUCKET_NAME --region us-east-2 || true
aws s3 sync dist/ s3://$BUCKET_NAME --region us-east-2
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html --region us-east-2

# Get website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website.us-east-2.amazonaws.com"

echo "=== Deployment Complete ==="
echo "Backend URL: http://$EC2_IP:3001"
echo "Frontend URL: $WEBSITE_URL"
echo ""
echo "Test the deployment:"
echo "curl http://$EC2_IP:3001/health"
echo ""
echo "Login with:"
echo "Email: admin@macal.cl"
echo "Password: MacalAdmin2024"

# Cleanup
rm -f deploy-package.sh