#!/bin/bash
set -e

echo "Deploying simple backend to EC2..."

# Configuration
INSTANCE_ID="i-09bb7ca5173ff79b1"
KEY_PATH="./macal-inventory-key.pem"
REGION="us-east-2"

# Check if key file exists
if [ ! -f "$KEY_PATH" ]; then
    echo "Error: Key file not found at $KEY_PATH"
    exit 1
fi

# Set correct permissions for key
chmod 400 "$KEY_PATH"

# Get instance public IP
echo "Getting EC2 instance IP..."
INSTANCE_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

if [ "$INSTANCE_IP" == "None" ] || [ -z "$INSTANCE_IP" ]; then
    echo "Error: Could not get instance IP"
    exit 1
fi

echo "Instance IP: $INSTANCE_IP"

# Copy simple backend file
echo "Copying simple backend file..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no \
    simple-backend.js \
    ec2-user@$INSTANCE_IP:/home/ec2-user/

# SSH and setup backend
echo "Setting up backend on EC2..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$INSTANCE_IP << 'EOF'
    set -e
    
    # Stop existing backend processes
    echo "Stopping existing processes..."
    sudo pkill -f "node.*server.js" || true
    sudo pkill -f "node.*simple-backend.js" || true
    sleep 2
    
    # Install dependencies if needed
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js..."
        curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
    
    # Create directory and setup
    mkdir -p /home/ec2-user/backend
    cd /home/ec2-user/backend
    
    # Copy simple backend
    cp /home/ec2-user/simple-backend.js .
    
    # Initialize package.json if it doesn't exist
    if [ ! -f package.json ]; then
        echo "Initializing package.json..."
        npm init -y
    fi
    
    # Install required packages
    echo "Installing dependencies..."
    npm install express cors jsonwebtoken
    
    # Start the backend with PM2 or nohup
    if command -v pm2 &> /dev/null; then
        echo "Starting with PM2..."
        pm2 stop simple-backend || true
        pm2 start simple-backend.js --name simple-backend
        pm2 save
    else
        echo "Starting with nohup..."
        nohup node simple-backend.js > backend.log 2>&1 &
        echo "Backend started with PID: $!"
    fi
    
    # Check if it's running
    sleep 3
    if curl -s http://localhost:3001/health > /dev/null; then
        echo "Backend is running successfully!"
    else
        echo "Backend failed to start. Check logs."
        tail -n 20 backend.log 2>/dev/null || true
        exit 1
    fi
EOF

echo "Simple backend deployed successfully!"
echo "Backend URL: http://$INSTANCE_IP:3001"
echo ""
echo "Test endpoints:"
echo "  Health: curl http://$INSTANCE_IP:3001/health"
echo "  Login:  curl -X POST http://$INSTANCE_IP:3001/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@macal.cl\",\"password\":\"MacalAdmin2024\"}'"