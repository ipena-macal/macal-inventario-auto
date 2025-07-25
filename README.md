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
