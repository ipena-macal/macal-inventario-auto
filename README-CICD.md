# 🚀 CI/CD Automático para MACAL Inventory

## ¿Qué incluye el CI/CD?

### ✅ Integración Continua (CI)
- **Tests automáticos** en cada push y pull request
- **Verificación de seguridad** con auditoría de dependencias
- **Validación de código** frontend y backend
- **Docker build** para verificar que la imagen se construye correctamente

### ✅ Despliegue Continuo (CD)
- **Deployment automático** al hacer push a `main/master/develop`
- **Zero-downtime deployment** con PM2
- **Rollback automático** si el health check falla
- **Actualización del frontend** en S3 automáticamente

## 🔧 Setup Inicial

### 1. Configurar la infraestructura EC2
```bash
cd scripts
./setup-ec2-for-cicd.sh
```

### 2. Configurar secrets en GitHub

Ve a tu repositorio → Settings → Secrets and variables → Actions:

**Secrets requeridos:**
- `AWS_ACCESS_KEY_ID`: Tu AWS Access Key
- `AWS_SECRET_ACCESS_KEY`: Tu AWS Secret Key

### 3. Subir los archivos de CI/CD a tu repo

```bash
# Copia estos archivos a tu repositorio:
cp -r .github/ /path/to/your/macal-inventario-auto/
cp scripts/ /path/to/your/macal-inventario-auto/

# En tu repositorio:
git add .github/ scripts/
git commit -m "Add CI/CD pipeline"
git push origin main
```

## 🎯 Flujo de Trabajo

### Desarrollo Diario
1. **Desarrolla** en feature branches
2. **Push** → Ejecuta tests automáticamente
3. **Pull Request** → Ejecuta CI completo
4. **Merge a main** → ¡Deployment automático!

### Pipeline Completo
```
Push/PR → Tests → Security Scan → Deploy Backend → Deploy Frontend → Notify
```

## 📊 Monitoreo y Logs

### Ver el estado del deployment:
```bash
# Logs de la aplicación
ssh ubuntu@3.15.143.80
pm2 logs

# Estado de los procesos
pm2 status

# Monitoring en tiempo real
pm2 monit
```

### URLs de verificación:
- **Backend Health**: http://3.15.143.80:3001/health
- **Frontend**: http://macal-inventory-frontend-036401800076-us-east-2.s3-website.us-east-2.amazonaws.com
- **GitHub Actions**: https://github.com/ipena-macal/macal-inventario-auto/actions

## 🛠 Comandos Útiles

### Deployment manual (si necesitas):
```bash
# Trigger manual deployment
gh workflow run deploy-aws.yml --ref main

# Ver logs del último deployment
gh run list --workflow=deploy-aws.yml
```

### Rollback (en caso de problemas):
```bash
# SSH al servidor
ssh ubuntu@3.15.143.80

# Ver versiones anteriores
ls -la macal-inventory-backup-*

# Restaurar versión anterior
pm2 stop all
mv macal-inventory macal-inventory-broken
mv macal-inventory-backup-YYYYMMDD-HHMMSS macal-inventory
cd macal-inventory/backend-node
pm2 start npm --name "macal-backend" -- start
```

## 🔒 Seguridad

- ✅ **Secrets** manejados por GitHub Actions
- ✅ **IAM roles** con permisos mínimos
- ✅ **Audit automático** de dependencias
- ✅ **HTTPS** para el frontend (via S3)

## 📈 Métricas y Alertas

El pipeline incluye:
- **Health checks** automáticos
- **Notificaciones** de deployment
- **Métricas** de build time
- **Logs** centralizados con PM2

## 🚨 Troubleshooting

### Si el deployment falla:
1. **Revisa GitHub Actions**: Ve a la pestaña Actions de tu repo
2. **Check logs**: Busca errores en los logs del workflow
3. **Verifica EC2**: SSH y revisa `pm2 logs`
4. **Health check**: Prueba `curl http://localhost:3001/health`

### Comandos de diagnóstico:
```bash
# En EC2
systemctl status amazon-ssm-agent
pm2 status
docker ps
npm test  # En el directorio backend-node
```

## 🎉 Beneficios

- **⚡ Deploy en 2-3 minutos** desde push hasta producción
- **🔒 Seguro**: Tests antes de cada deploy
- **📱 Mobile-friendly**: Zero-downtime deployments
- **🔄 Automático**: No más deployments manuales
- **📊 Visible**: Todo el proceso es transparente en GitHub

¡Con esto tendrás un pipeline de CI/CD profesional para MACAL Inventory! 🚀