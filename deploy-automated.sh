#!/bin/bash

echo "🚀 AUTOMATED DEPLOYMENT TO AWS EC2"
echo "=================================="

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS credentials not configured!"
    echo "Please run: aws configure"
    echo "You need:"
    echo "- AWS Access Key ID"
    echo "- AWS Secret Access Key"
    echo "- Default region: us-east-2"
    exit 1
fi

INSTANCE_ID="i-09bb7ca5173ff79b1"
EC2_IP="3.148.227.249"

echo "📦 Creating deployment package..."
cd final-system

# Create a complete deployment script with embedded files
cat > ../deploy-complete.sh << 'DEPLOY_SCRIPT'
#!/bin/bash

echo "🔧 Starting deployment on EC2..."

# Stop existing services
sudo pkill -f node || true
pm2 stop all || true
pm2 delete all || true

# Ensure Node.js 18 is installed
if ! node --version | grep -q "v18"; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# Install PM2 globally
sudo npm install -g pm2

# Create application directory
cd /home/ec2-user
rm -rf macal-inventory
mkdir -p macal-inventory
cd macal-inventory

# Create package.json
cat > package.json << 'EOF'
{
  "name": "macal-inventory",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "pdfkit": "^0.13.0"
  }
}
EOF

# Install dependencies
npm install

# Create directories
mkdir -p public pdfs

# Create server.js
cat > server.js << 'SERVER_JS'
DEPLOY_SCRIPT

# Append the actual server.js content
cat server.js >> ../deploy-complete.sh

cat >> ../deploy-complete.sh << 'DEPLOY_SCRIPT'
SERVER_JS

# Create pdf-generator.js
cat > pdf-generator.js << 'PDF_JS'
DEPLOY_SCRIPT

# Append the actual pdf-generator.js content
cat pdf-generator.js >> ../deploy-complete.sh

cat >> ../deploy-complete.sh << 'DEPLOY_SCRIPT'
PDF_JS

# Create public/index.html
cat > public/index.html << 'INDEX_HTML'
DEPLOY_SCRIPT

# Append the actual index.html content
cat public/index.html >> ../deploy-complete.sh

cat >> ../deploy-complete.sh << 'DEPLOY_SCRIPT'
INDEX_HTML

# Set permissions
chmod -R 755 /home/ec2-user/macal-inventory

# Configure firewall
sudo firewall-cmd --permanent --add-port=3001/tcp 2>/dev/null || true
sudo firewall-cmd --reload 2>/dev/null || true

# Start application with PM2
pm2 start server.js --name macal-inventory
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo "✅ Deployment complete!"
echo "🌐 Application should be running at http://3.148.227.249:3001"
DEPLOY_SCRIPT

echo "📤 Deploying to EC2 instance..."

# Deploy via SSM
aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=$(cat ../deploy-complete.sh | base64 -w 0)" \
    --output json > deployment.json

COMMAND_ID=$(cat deployment.json | grep -o '"CommandId": "[^"]*' | grep -o '[^"]*$')

echo "📋 Command ID: $COMMAND_ID"
echo "⏳ Waiting for deployment to complete..."

# Wait for command to complete
sleep 10

# Check deployment status
aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --output text

echo ""
echo "🔍 Verifying deployment..."
sleep 5

# Test the deployment
if curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP:3001/api/health | grep -q "200"; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "🌐 Access the system at: http://$EC2_IP:3001"
    echo ""
    echo "📧 Login credentials:"
    echo "👤 Admin: admin@macal.cl / MacalAdmin2024"
    echo "🔍 Inspector: inspector@macal.cl / Inspector2024"
    echo "📝 Operador: operador@macal.cl / Operador2024"
else
    echo "❌ Deployment verification failed"
    echo "Check: http://$EC2_IP:3001"
fi

# Clean up
rm -f ../deploy-complete.sh deployment.json