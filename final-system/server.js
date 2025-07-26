const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data
const users = {
  'admin@macal.cl': { 
    password: 'MacalAdmin2024', 
    name: 'Administrador',
    role: 'admin',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEifQ.test'
  }
};

const vehicles = [
  { 
    id: 1, 
    plate: 'GFKL-82', 
    brand: 'Toyota', 
    model: 'Corolla',
    year: 2022,
    color: 'Blanco',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=400&h=250&fit=crop'
  },
  { 
    id: 2, 
    plate: 'HXRT-93', 
    brand: 'Nissan', 
    model: 'Versa',
    year: 2023,
    color: 'Negro',
    status: 'inspection',
    image: 'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?w=400&h=250&fit=crop'
  },
  { 
    id: 3, 
    plate: 'JKLM-45', 
    brand: 'Chevrolet', 
    model: 'Sail',
    year: 2021,
    color: 'Rojo',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=250&fit=crop'
  }
];

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  
  if (user && user.password === password) {
    res.json({
      success: true,
      token: user.token,
      user: {
        email,
        name: user.name,
        role: user.role
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }
});

app.get('/api/vehicles', (req, res) => {
  res.json({
    success: true,
    data: vehicles
  });
});

app.get('/api/vehicles/:id', (req, res) => {
  const vehicle = vehicles.find(v => v.id === parseInt(req.params.id));
  if (vehicle) {
    res.json({ success: true, data: vehicle });
  } else {
    res.status(404).json({ success: false, message: 'Vehicle not found' });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
  ✅ Server running on port ${PORT}
  🌐 http://localhost:${PORT}
  
  Login credentials:
  📧 admin@macal.cl
  🔑 MacalAdmin2024
  `);
});