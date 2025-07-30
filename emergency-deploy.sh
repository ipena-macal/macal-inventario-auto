#!/bin/bash

echo "🚨 EMERGENCY DEPLOYMENT SCRIPT"
echo "============================="
echo ""
echo "This script will create a deployment command that you can run directly on the EC2 instance."
echo ""

# Create the deployment commands
cat > deploy-commands.txt << 'COMMANDS'
# 1. Connect to EC2:
aws ssm start-session --target i-09bb7ca5173ff79b1

# 2. Once connected, run these commands:

# Stop all Node processes
sudo pkill -f node || true
pm2 stop all || true
pm2 delete all || true

# Install Node.js 18 if needed
if ! node --version | grep -q "v18"; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# Install PM2
sudo npm install -g pm2

# Clean and create directory
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

# Create server.js (copy the content from final-system/server.js)
cat > server.js << 'EOF'
COMMANDS

# Append server.js content
cat final-system/server.js >> deploy-commands.txt

echo 'EOF' >> deploy-commands.txt
echo '' >> deploy-commands.txt

# Continue with pdf-generator.js
cat >> deploy-commands.txt << 'COMMANDS'
# Create pdf-generator.js
cat > pdf-generator.js << 'EOF'
COMMANDS

# Append pdf-generator.js content
cat final-system/pdf-generator.js >> deploy-commands.txt

echo 'EOF' >> deploy-commands.txt
echo '' >> deploy-commands.txt

# Continue with index.html
cat >> deploy-commands.txt << 'COMMANDS'
# Create public/index.html
cat > public/index.html << 'EOF'
COMMANDS

# Append index.html content
cat final-system/public/index.html >> deploy-commands.txt

echo 'EOF' >> deploy-commands.txt
echo '' >> deploy-commands.txt

# Final commands
cat >> deploy-commands.txt << 'COMMANDS'

# Set permissions
chmod -R 755 /home/ec2-user/macal-inventory

# Configure firewall
sudo firewall-cmd --permanent --add-port=3001/tcp 2>/dev/null || true
sudo firewall-cmd --reload 2>/dev/null || true

# Start with PM2
pm2 start server.js --name macal-inventory
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Verify deployment
sleep 3
curl http://localhost:3001/api/health

echo "✅ Deployment complete!"
echo "🌐 Access at: http://3.148.227.249:3001"
COMMANDS

echo "📄 Deployment commands saved to: deploy-commands.txt"
echo ""
echo "To deploy:"
echo "1. Open deploy-commands.txt"
echo "2. Copy the AWS SSM command to connect to EC2"
echo "3. Once connected, copy and paste all the remaining commands"
echo ""
echo "Or if you have AWS CLI configured:"
echo "aws ssm start-session --target i-09bb7ca5173ff79b1"