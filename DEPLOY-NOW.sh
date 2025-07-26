#!/bin/bash

# DEPLOY TO AWS EC2 - FINAL SYSTEM
EC2_IP="3.148.227.249"

echo "🚀 DEPLOYING MACAL INVENTORY TO AWS EC2..."
echo "================================================"

# Create deployment tarball
echo "📦 Creating deployment package..."
cd final-system
tar -czf ../deploy.tar.gz server.js package.json public/

cd ..

echo ""
echo "📋 MANUAL DEPLOYMENT STEPS:"
echo "================================================"
echo "Since SSH access is not working, follow these steps:"
echo ""
echo "1. Connect to your EC2 instance via AWS Console:"
echo "   - Go to EC2 > Instances"
echo "   - Select your instance (IP: $EC2_IP)"
echo "   - Click 'Connect' > 'Session Manager'"
echo ""
echo "2. Once connected, run these commands:"
echo ""
cat << 'DEPLOY_SCRIPT'
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Create app directory
mkdir -p ~/macal-inventory
cd ~/macal-inventory

# Download the app (you'll need to upload deploy.tar.gz to S3 first)
# Or manually copy the files from final-system/

# For now, create the files directly:
cat > package.json << 'EOF'
{
  "name": "macal-inventory",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

# Create public directory
mkdir -p public

# You'll need to copy server.js and public/index.html manually

# Install dependencies
npm install

# Install PM2 for process management
sudo npm install -g pm2

# Start the application
pm2 start server.js --name macal-inventory
pm2 save
pm2 startup | grep sudo | bash

# Configure firewall
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload

DEPLOY_SCRIPT

echo ""
echo "3. Your application will be available at:"
echo "   http://$EC2_IP:3001"
echo ""
echo "================================================"
echo ""
echo "📄 Files to deploy are in: final-system/"
echo "   - server.js"
echo "   - package.json"
echo "   - public/index.html"
echo ""
echo "🔐 Login credentials:"
echo "   Email: admin@macal.cl"
echo "   Password: MacalAdmin2024"
echo ""