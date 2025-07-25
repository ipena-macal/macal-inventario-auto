const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

// Initialize Express
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Create HTTP server for WebSocket
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'macal_inventory',
});

// Redis connection
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6380
  }
});

redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.connect();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Initialize database tables
async function initDB() {
  try {
    // Users table with enhanced permissions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'inspector',
        active BOOLEAN DEFAULT true,
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add columns if they don't exist
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
    `);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
    `);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // Vehicles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        license_plate VARCHAR(50) UNIQUE NOT NULL,
        vin VARCHAR(50),
        make VARCHAR(100),
        model VARCHAR(100),
        year INTEGER,
        color VARCHAR(50),
        mileage INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        check_in_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        check_out_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inspections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inspections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id),
        inspector_id UUID REFERENCES users(id),
        type VARCHAR(50) DEFAULT 'entry',
        status VARCHAR(50) DEFAULT 'draft',
        data JSONB DEFAULT '{}',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Form templates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS form_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        config JSONB NOT NULL,
        active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert demo users with different roles
    const hashedPassword = await bcrypt.hash('MacalAdmin2024', 10);
    
    // Admin user with all permissions
    await pool.query(`
      INSERT INTO users (email, password, name, role, permissions)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET permissions = $5
    `, ['admin@macal.cl', hashedPassword, 'Administrador', 'admin', JSON.stringify({
      // CRUD completo
      delete_inspections: true,
      create_inspections: true,
      edit_inspections: true,
      // Gestión de usuarios
      manage_users: true,
      reset_passwords: true,
      // Gestión de plantillas
      manage_templates: true,
      delete_templates: true,
      // Gestión de vehículos
      create_vehicles: true,
      edit_vehicles: true,
      delete_vehicles: true,
      // Otros
      view_all_inspections: true,
      export_reports: true
    })]);

    // Leader user with almost same permissions as admin
    await pool.query(`
      INSERT INTO users (email, password, name, role, permissions)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET role = $4, permissions = $5
    `, ['leader@macal.cl', hashedPassword, 'Líder López', 'leader', JSON.stringify({
      // CRUD completo
      delete_inspections: true,
      create_inspections: true,
      edit_inspections: true,
      // Gestión de usuarios
      manage_users: true,
      reset_passwords: true,
      // Gestión de plantillas
      manage_templates: true,
      delete_templates: true,
      // Gestión de vehículos
      create_vehicles: true,
      edit_vehicles: true,
      delete_vehicles: true,
      // Otros
      view_all_inspections: true,
      export_reports: true
    })]);

    // Inspector user with limited permissions
    await pool.query(`
      INSERT INTO users (email, password, name, role, permissions)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET role = $4, permissions = $5
    `, ['inspector@macal.cl', hashedPassword, 'Inspector García', 'inspector', JSON.stringify({
      // Solo puede ver y actualizar inspecciones existentes
      delete_inspections: false,
      create_inspections: false,
      edit_inspections: false,
      view_inspections: true,
      update_inspection_fields: true, // Solo actualizar campos durante inspección
      // NO gestión de usuarios
      manage_users: false,
      reset_passwords: false,
      // NO gestión de plantillas
      manage_templates: false,
      delete_templates: false,
      // NO gestión de vehículos
      create_vehicles: false,
      edit_vehicles: false,
      delete_vehicles: false,
      // Otros
      view_all_inspections: false, // Solo ve las suyas
      export_reports: false
    })]);

    // Client user with read-only permissions
    await pool.query(`
      INSERT INTO users (email, password, name, role, permissions)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['client@bank.cl', hashedPassword, 'Banco Santander', 'client', JSON.stringify({
      delete_inspections: false,
      manage_users: false,
      manage_templates: false,
      view_all_inspections: false,
      create_inspections: false,
      edit_vehicles: false,
      client_view_only: true
    })]);

    // Insert demo vehicles
    const demoVehicles = [
      ['GFKL-82', 'Toyota', 'Corolla', 2022, 'Blanco', 15000, 'completed'],
      ['HXRT-93', 'Nissan', 'Versa', 2023, 'Negro', 8000, 'inspecting'],
      ['JKLM-45', 'Chevrolet', 'Sail', 2021, 'Rojo', 22000, 'pending'],
      ['MNOP-67', 'Hyundai', 'Accent', 2023, 'Azul', 5000, 'pending'],
    ];

    for (const vehicle of demoVehicles) {
      await pool.query(`
        INSERT INTO vehicles (license_plate, make, model, year, color, mileage, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (license_plate) DO NOTHING
      `, vehicle);
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Auth routes
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND active = true', [email]);
    const user = result.rows[0];

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vehicle routes
app.get('/api/v1/vehicles', authenticateToken, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (license_plate ILIKE $${params.length} OR make ILIKE $${params.length} OR model ILIKE $${params.length})`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/vehicles', authenticateToken, async (req, res) => {
  try {
    const { license_plate, vin, make, model, year, color, mileage } = req.body;
    
    const result = await pool.query(`
      INSERT INTO vehicles (license_plate, vin, make, model, year, color, mileage)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [license_plate, vin, make, model, year, color, mileage]);

    // Publish to Redis for real-time updates
    await redisClient.publish('vehicle-updates', JSON.stringify({
      type: 'vehicle_created',
      data: result.rows[0]
    }));

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/v1/vehicles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE vehicles 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, ...values]);

    // Publish update
    await redisClient.publish('vehicle-updates', JSON.stringify({
      type: 'vehicle_updated',
      data: result.rows[0]
    }));

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inspection routes
app.get('/api/v1/inspections', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, v.license_plate, v.make, v.model, u.name as inspector_name
      FROM inspections i
      JOIN vehicles v ON i.vehicle_id = v.id
      JOIN users u ON i.inspector_id = u.id
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/inspections', authenticateToken, async (req, res) => {
  try {
    const { vehicle_id, type } = req.body;
    
    const result = await pool.query(`
      INSERT INTO inspections (vehicle_id, inspector_id, type)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [vehicle_id, req.user.id, type || 'entry']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Real-time inspection updates
app.post('/api/v1/inspections/:id/update', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { path, value } = req.body;

    // Get current inspection
    const result = await pool.query('SELECT * FROM inspections WHERE id = $1', [id]);
    const inspection = result.rows[0];

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    // Update the data field
    const updatedData = { ...inspection.data };
    const keys = path.split('.');
    let current = updatedData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;

    // Save to database
    await pool.query(`
      UPDATE inspections 
      SET data = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [JSON.stringify(updatedData), id]);

    // Cache in Redis
    await redisClient.set(`inspection:${id}`, JSON.stringify(updatedData), {
      EX: 3600 // 1 hour
    });

    // Broadcast update to all connected clients
    const update = {
      inspectionId: id,
      path,
      value,
      timestamp: new Date(),
      userId: req.user.id
    };

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'inspection_update',
          data: update
        }));
      }
    });

    res.json({ success: true, update });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inspection status
app.put('/api/v1/inspections/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completed_at } = req.body;
    
    const result = await pool.query(`
      UPDATE inspections 
      SET status = $1, completed_at = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [status, completed_at, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Form template routes
app.get('/api/v1/form-templates', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM form_templates WHERE active = true ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/form-templates', authenticateToken, async (req, res) => {
  try {
    const { name, type, config } = req.body;
    
    const result = await pool.query(`
      INSERT INTO form_templates (name, type, config, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, type, JSON.stringify(config), req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User management routes
app.get('/api/v1/users', authenticateToken, async (req, res) => {
  try {
    // Check if user has permission to manage users
    const userResult = await pool.query('SELECT permissions FROM users WHERE id = $1', [req.user.id]);
    const userPermissions = userResult.rows[0]?.permissions || {};
    
    if (!userPermissions.manage_users) {
      return res.status(403).json({ error: 'No tiene permisos para ver usuarios' });
    }

    const result = await pool.query(`
      SELECT id, email, name, role, active, permissions, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/users', authenticateToken, async (req, res) => {
  try {
    // Check permissions
    const userResult = await pool.query('SELECT permissions FROM users WHERE id = $1', [req.user.id]);
    const userPermissions = userResult.rows[0]?.permissions || {};
    
    if (!userPermissions.manage_users) {
      return res.status(403).json({ error: 'No tiene permisos para crear usuarios' });
    }

    const { email, password, name, role, permissions } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(`
      INSERT INTO users (email, password, name, role, permissions)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role, permissions, active, created_at
    `, [email, hashedPassword, name, role, JSON.stringify(permissions || {})]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/v1/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check permissions
    const userResult = await pool.query('SELECT permissions FROM users WHERE id = $1', [req.user.id]);
    const userPermissions = userResult.rows[0]?.permissions || {};
    
    if (!userPermissions.manage_users) {
      return res.status(403).json({ error: 'No tiene permisos para editar usuarios' });
    }

    const { id } = req.params;
    const { name, role, permissions, active } = req.body;
    
    const result = await pool.query(`
      UPDATE users 
      SET name = $1, role = $2, permissions = $3, active = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, email, name, role, permissions, active, created_at
    `, [name, role, JSON.stringify(permissions), active, id]);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password route
app.put('/api/v1/users/:id/reset-password', authenticateToken, async (req, res) => {
  try {
    // Check if user has permission to reset passwords
    const userResult = await pool.query('SELECT permissions FROM users WHERE id = $1', [req.user.id]);
    const userPermissions = userResult.rows[0]?.permissions || {};
    
    if (!userPermissions.reset_passwords) {
      return res.status(403).json({ error: 'No tiene permisos para resetear contraseñas' });
    }

    const { id } = req.params;
    const { newPassword } = req.body;
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await pool.query(`
      UPDATE users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, name
    `, [hashedPassword, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Contraseña actualizada exitosamente', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete inspection route
app.delete('/api/v1/inspections/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user has permission to delete inspections
    const userResult = await pool.query('SELECT permissions FROM users WHERE id = $1', [req.user.id]);
    const userPermissions = userResult.rows[0]?.permissions || {};
    
    if (!userPermissions.delete_inspections) {
      return res.status(403).json({ error: 'No tiene permisos para eliminar inspecciones' });
    }

    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM inspections WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inspección no encontrada' });
    }

    res.json({ message: 'Inspección eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'subscribe_inspection') {
        ws.inspectionId = data.inspectionId;
        console.log(`Client subscribed to inspection ${data.inspectionId}`);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Start server
const PORT = process.env.PORT || 3001;

initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🔗 http://localhost:${PORT}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
  await pool.end();
  await redisClient.quit();
});