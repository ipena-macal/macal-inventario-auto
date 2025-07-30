#!/bin/bash

echo "🔧 FIXING AWS DEPLOYMENT NOW"
echo "==========================="
echo ""
echo "This will push a commit that triggers the GitHub Actions deployment."
echo ""

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Create a simple test file to trigger deployment
echo "Deployment fix triggered at $(date)" > deployment-fix.txt

# Add, commit and push
git add deployment-fix.txt
git commit -m "Trigger deployment fix - deploy final-system to AWS"
git push origin main

echo ""
echo "✅ Deployment triggered!"
echo ""
echo "⏳ Wait 1-2 minutes for deployment to complete"
echo ""
echo "Then check: http://3.148.227.249:3001"
echo ""
echo "📧 Login credentials:"
echo "Admin: admin@macal.cl / MacalAdmin2024"
echo "Inspector: inspector@macal.cl / Inspector2024"
echo "Operador: operador@macal.cl / Operador2024"