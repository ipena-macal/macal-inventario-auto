#!/bin/bash

echo "🔍 Checking MACAL Inventory Deployment Status"
echo "============================================"

EC2_IP="3.148.227.249"
INSTANCE_ID="i-09bb7ca5173ff79b1"

echo ""
echo "1️⃣ Testing HTTP connectivity..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP:3001 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "✅ Server is responding (HTTP $HTTP_CODE)"
    
    echo ""
    echo "2️⃣ Testing API health endpoint..."
    curl -s http://$EC2_IP:3001/api/health || echo "No health endpoint"
    
    echo ""
    echo "3️⃣ Testing login endpoint..."
    curl -s -X POST http://$EC2_IP:3001/api/login \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@macal.cl","password":"MacalAdmin2024"}' || echo "Login test failed"
else
    echo "❌ Server is not responding on port 3001 (HTTP code: $HTTP_CODE)"
    
    echo ""
    echo "Checking if port 3001 is open..."
    nc -zv $EC2_IP 3001 2>&1 || echo "Port 3001 appears to be closed"
fi

echo ""
echo "4️⃣ EC2 Instance Status..."
if aws sts get-caller-identity &>/dev/null; then
    INSTANCE_STATE=$(aws ec2 describe-instances \
      --instance-ids $INSTANCE_ID \
      --query 'Reservations[0].Instances[0].State.Name' \
      --output text 2>/dev/null || echo "Unknown")
    echo "Instance state: $INSTANCE_STATE"
else
    echo "⚠️  AWS credentials not configured - skipping EC2 checks"
fi

echo ""
echo "============================================"
echo "📋 Summary:"
echo ""
echo "If the server is not responding, you may need to:"
echo "1. Check GitHub Actions: https://github.com/ignacioenlosmercados/macal-inventory-v2/actions"
echo "2. Configure AWS credentials and run: ./deploy-automated.sh"
echo "3. Manual deployment instructions in: DEPLOY_TO_AWS.sh"