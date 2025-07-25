#!/bin/bash

# Script to setup EC2 instance for CI/CD deployment

echo "========================================"
echo "   SETUP EC2 FOR CI/CD"
echo "========================================"
echo ""

PROFILE="AdministratorAccess-036401800076"
REGION="us-east-2"
INSTANCE_ID="i-094eb0c84746592d3"

echo "Setting up EC2 instance for automated deployments..."
echo "Instance ID: $INSTANCE_ID"
echo ""

# Create IAM role for EC2 to access S3
echo "Creating IAM role for EC2..."

# Create trust policy
cat > ec2-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create S3 access policy
cat > s3-access-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::macal-deployment-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::macal-deployment-*"
      ]
    }
  ]
}
EOF

# Create or update IAM role
aws iam create-role \
  --role-name macal-inventory-ec2-deployment-role \
  --assume-role-policy-document file://ec2-trust-policy.json \
  --profile $PROFILE \
  --region $REGION || echo "Role may already exist"

# Attach policy
aws iam put-role-policy \
  --role-name macal-inventory-ec2-deployment-role \
  --policy-name MacalS3DeploymentAccess \
  --policy-document file://s3-access-policy.json \
  --profile $PROFILE \
  --region $REGION

# Install SSM agent and AWS CLI on EC2
SETUP_SCRIPT=$(cat << 'EOF'
#!/bin/bash
set -e

echo "Setting up EC2 instance for CI/CD..."

# Update system
sudo apt-get update

# Install AWS CLI v2 if not present
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi

# Install SSM agent if not present
if ! systemctl is-active --quiet amazon-ssm-agent; then
    echo "Installing SSM Agent..."
    sudo snap install amazon-ssm-agent --classic
    sudo systemctl enable amazon-ssm-agent
    sudo systemctl start amazon-ssm-agent
fi

# Install Node.js 18 if not present
if ! command -v node &> /dev/null || [[ $(node -v) != v18* ]]; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
    pm2 startup systemd -u ubuntu --hp /home/ubuntu
fi

# Create deployment directory and set permissions
sudo mkdir -p /opt/macal-inventory
sudo chown -R ubuntu:ubuntu /opt/macal-inventory

# Create environment file if it doesn't exist
if [ ! -f /home/ubuntu/.env ]; then
    echo "Creating default environment file..."
    cat > /home/ubuntu/.env << ENVEOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=SecurePass123
DB_NAME=macal_inventory
REDIS_HOST=localhost
REDIS_PORT=6380
JWT_SECRET=YourVerySecureJWTSecretKeyAtLeast32CharsLong
AWS_REGION=us-east-2
ENVEOF
fi

echo "✅ EC2 instance setup complete!"
echo "Instance is ready for CI/CD deployments"
EOF
)

echo "Running setup script on EC2..."
aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --document-name "AWS-RunShellScript" \
  --parameters "commands=[\"$SETUP_SCRIPT\"]" \
  --comment "Setup EC2 for CI/CD" \
  --profile $PROFILE \
  --region $REGION

# Clean up temporary files
rm -f ec2-trust-policy.json s3-access-policy.json

echo ""
echo "========================================"
echo "Next steps to enable CI/CD:"
echo ""
echo "1. Add these secrets to your GitHub repository:"
echo "   AWS_ACCESS_KEY_ID"
echo "   AWS_SECRET_ACCESS_KEY"
echo ""
echo "2. Commit the .github/workflows files to your repo"
echo ""
echo "3. Push to main/master branch to trigger deployment"
echo ""
echo "Your CI/CD pipeline will:"
echo "- Run tests on every push/PR"
echo "- Deploy automatically to AWS on main branch"
echo "- Update both backend and frontend"
echo "========================================"