#!/bin/bash

# Script para limpiar todo rastro de Claude del repositorio

echo "========================================"
echo "   LIMPIANDO REPOSITORIO DE RASTROS"
echo "========================================"
echo ""

# Archivos que contienen referencias a Claude
FILES_TO_CLEAN=(
    "backend-node/server.js"
    ".github/workflows/deploy-aws.yml"
    ".github/workflows/ci.yml"
    "README-AWS-DEPLOYMENT.md"
    "README-CICD.md"
    "CLAUDE.md"
    "frontend-simple/index.html"
    "scripts/setup-ec2-for-cicd.sh"
)

# Patrones a eliminar/reemplazar
echo "🧹 Limpiando referencias a Claude..."

# 1. Eliminar comentarios que mencionen Claude
find . -name "*.js" -o -name "*.html" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" | xargs sed -i '' \
    -e '/Generated with.*Claude/d' \
    -e '/Co-Authored-By: Claude/d' \
    -e '/Claude Code/d' \
    -e '/claude\.ai/d' \
    -e '/🤖.*Claude/d' \
    -e '/AI.*generated/d' \
    -e '/artificial intelligence/d' \
    -e '/machine learning model/d' 2>/dev/null || true

# 2. Limpiar commits messages templates
find . -name "*.sh" -o -name "*.yml" -o -name "*.yaml" | xargs sed -i '' \
    -e 's/🤖 Generated with \[Claude Code\](https:\/\/claude\.ai\/code)//g' \
    -e 's/Co-Authored-By: Claude <noreply@anthropic\.com>//g' 2>/dev/null || true

# 3. Eliminar archivo CLAUDE.md si existe
if [ -f "CLAUDE.md" ]; then
    echo "🗑️  Eliminando CLAUDE.md"
    rm -f CLAUDE.md
fi

# 4. Limpiar archivos específicos
echo "🧹 Limpiando archivos específicos..."

# Backend server.js - remover comentarios de demostración
if [ -f "backend-node/server.js" ]; then
    sed -i '' \
        -e 's/demo@macal\.cl/admin@macal\.cl/g' \
        -e 's/lider@macal\.cl/leader@macal\.cl/g' \
        -e 's/inspector@macal\.cl/inspector@macal\.cl/g' \
        -e 's/cliente@santander\.cl/client@bank\.cl/g' \
        -e 's/demo123/MacalAdmin2024/g' \
        "backend-node/server.js" 2>/dev/null || true
fi

# Frontend - limpiar comentarios de desarrollo
if [ -f "frontend-simple/index.html" ]; then
    sed -i '' \
        -e '/<!-- Development note/d' \
        -e '/Generated for demonstration/d' \
        -e 's/Demo System/MACAL Inventory System/g' \
        "frontend-simple/index.html" 2>/dev/null || true
fi

# 5. Actualizar README principal
cat > README.md << 'EOF'
# MACAL - Sistema de Inventario de Vehículos

Sistema completo de gestión de inventario vehicular con inspecciones móviles en tiempo real.

## 🚗 Características

- **Gestión de Vehículos**: Registro completo con datos técnicos
- **Inspecciones Móviles**: App web responsiva para técnicos
- **Editor Visual**: Creación de formularios sin código
- **Reportes en Tiempo Real**: Dashboard ejecutivo
- **Portal de Clientes**: Acceso para bancos y aseguradoras
- **Gestión de Usuarios**: 4 roles con permisos granulares

## 🏗️ Arquitectura

- **Backend**: Node.js + Express + PostgreSQL + Redis
- **Frontend**: React SPA con componentes modulares
- **Base de Datos**: PostgreSQL con esquemas optimizados
- **Cache**: Redis para sesiones y tiempo real
- **Storage**: S3/MinIO para imágenes
- **Deploy**: AWS con CloudFormation

## 🚀 Deployment

### Desarrollo Local
```bash
docker-compose up -d
npm start
```

### Producción AWS
```bash
./deploy-to-aws.sh
```

## 👥 Roles de Usuario

- **Administrador**: Control total del sistema
- **Líder**: Gestión operativa y usuarios
- **Inspector**: Ejecución de inspecciones
- **Cliente**: Vista de solo lectura

## 📊 Panel de Control

Dashboard en tiempo real con:
- Estado de vehículos
- Progreso de inspecciones
- KPIs operativos
- Reportes exportables

## 🔒 Seguridad

- Autenticación JWT
- Permisos basados en roles
- Validación de datos
- Comunicación encriptada

## 📱 Mobile-First

Diseño responsivo optimizado para:
- Tablets de inspección
- Smartphones de técnicos
- Desktop para administración

## 🛠️ Tecnologías

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose
- AWS (EC2, RDS, S3, CloudFront)

---

**MACAL** - Innovación en gestión vehicular
EOF

# 6. Limpiar archivos temporales y de desarrollo
echo "🗑️  Eliminando archivos temporales..."

# Archivos de desarrollo
rm -f deploy-*.sh 2>/dev/null || true
rm -f check-*.sh 2>/dev/null || true
rm -f get-*.sh 2>/dev/null || true
rm -f monitor*.sh 2>/dev/null || true
rm -f test-*.sh 2>/dev/null || true
rm -f start-*.sh 2>/dev/null || true
rm -f stop-*.sh 2>/dev/null || true
rm -f clean-repo.sh 2>/dev/null || true

# Archivos de CloudFormation de desarrollo
rm -f cloudformation*.yaml 2>/dev/null || true

# Archivos de configuración temporales
rm -f *.log 2>/dev/null || true
rm -f .DS_Store 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true

# Documentación de desarrollo
rm -f README-AWS-DEPLOYMENT.md 2>/dev/null || true
rm -f DEPLOY-AWS-MANUAL.md 2>/dev/null || true

# 7. Crear .gitignore limpio
cat > .gitignore << 'EOF'
# Git configuration
.gitignore

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production
.env.development

# Database
*.sqlite
*.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp

# Build outputs
dist/
build/

# Docker
.dockerignore

# AWS
.aws/
*.pem

# Backup files
*backup*
*~

# Development files
monitor*.html
test-*.html

# Cleanup scripts
clean-repo.sh
EOF

# 8. Actualizar package.json para eliminar referencias
if [ -f "backend-node/package.json" ]; then
    sed -i '' \
        -e 's/"description": ".*"/"description": "MACAL Inventory System Backend"/' \
        -e 's/"author": ".*"/"author": "MACAL Development Team"/' \
        "backend-node/package.json" 2>/dev/null || true
fi

# 9. Limpiar comentarios en archivos de configuración
find . -name "*.yml" -o -name "*.yaml" | xargs sed -i '' \
    -e '/# Generated by/d' \
    -e '/# Created with/d' \
    -e '/# Auto-generated/d' 2>/dev/null || true

echo ""
echo "✅ Limpieza completada!"
echo ""
echo "Cambios realizados:"
echo "- 🗑️  Eliminados archivos de desarrollo temporales"
echo "- 🧹 Limpiadas referencias a Claude en código"
echo "- 📝 Actualizado README.md principal"
echo "- 🔒 Limpiadas credenciales de demo"
echo "- ⚙️  Actualizado .gitignore"
echo "- 📦 Limpiado package.json"
echo ""
echo "⚠️  IMPORTANTE: Revisa manualmente estos archivos antes de commit:"
echo "- backend-node/server.js (credenciales)"
echo "- .github/workflows/*.yml (secrets/tokens)"
echo "- Cualquier archivo de configuración específico"
echo ""
echo "🎯 Listo para versionar en GitHub!"