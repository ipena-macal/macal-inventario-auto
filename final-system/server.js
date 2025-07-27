const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateCheckInPDF } = require('./pdf-generator');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.static('public'));
app.use('/pdfs', express.static('pdfs')); // Serve PDF files

// Data
const users = {
  'admin@macal.cl': { 
    password: 'MacalAdmin2024', 
    name: 'Administrador',
    role: 'admin',
    email: 'admin@macal.cl',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEifQ.test'
  },
  'inspector@macal.cl': { 
    password: 'Inspector2024', 
    name: 'Inspector García',
    role: 'inspector',
    email: 'inspector@macal.cl',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIifQ.test'
  },
  'operador@macal.cl': { 
    password: 'Operador2024', 
    name: 'Operador Pérez',
    role: 'operador',
    email: 'operador@macal.cl',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMifQ.test'
  }
};

let vehicleIdCounter = 4;
const vehicles = [
  { 
    id: 1, 
    plate: 'GFKL-82', 
    brand: 'Toyota', 
    model: 'Corolla',
    year: 2022,
    color: 'Blanco',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=400&h=250&fit=crop',
    owner: 'Juan Pérez',
    ownerPhone: '+56912345678',
    ownerEmail: 'juan@email.com',
    checkinDate: new Date('2025-01-20'),
    inspections: []
  },
  { 
    id: 2, 
    plate: 'HXRT-93', 
    brand: 'Nissan', 
    model: 'Versa',
    year: 2023,
    color: 'Negro',
    status: 'inspection',
    image: 'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?w=400&h=250&fit=crop',
    owner: 'María González',
    ownerPhone: '+56987654321',
    ownerEmail: 'maria@email.com',
    checkinDate: new Date('2025-01-18'),
    inspections: []
  },
  { 
    id: 3, 
    plate: 'JKLM-45', 
    brand: 'Chevrolet', 
    model: 'Sail',
    year: 2021,
    color: 'Rojo',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=250&fit=crop',
    owner: 'Carlos López',
    ownerPhone: '+56911223344',
    ownerEmail: 'carlos@email.com',
    checkinDate: new Date('2025-01-15'),
    inspections: []
  }
];

const inspections = [];
const tasks = [];

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

// Check-in endpoint
app.post('/api/vehicles/checkin', async (req, res) => {
  try {
    const { photos, ...vehicleData } = req.body;
    
    const newVehicle = {
      id: vehicleIdCounter++,
      ...vehicleData,
      status: 'active',
      checkinDate: new Date(),
      inspections: [],
      photos: photos || [],
      image: photos && photos.length > 0 ? photos[0].url : `https://source.unsplash.com/400x250/?car,${vehicleData.brand}`
    };
    
    // Generate PDF
    try {
      const pdfResult = await generateCheckInPDF(newVehicle);
      newVehicle.checkInPDF = `/pdfs/${pdfResult.filename}`;
      console.log('PDF generated:', pdfResult.filename);
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      // Continue even if PDF generation fails
    }
    
    vehicles.push(newVehicle);
    
    // Create task for new vehicle
    tasks.push({
      id: tasks.length + 1,
      type: 'inspection',
      vehicleId: newVehicle.id,
      vehicle: `${newVehicle.plate} - ${newVehicle.brand} ${newVehicle.model}`,
      assignedTo: 'Inspector García',
      status: 'pending',
      createdAt: new Date()
    });
    
    res.json({ 
      success: true, 
      data: newVehicle,
      pdfUrl: newVehicle.checkInPDF
    });
  } catch (error) {
    console.error('Error in check-in:', error);
    res.status(500).json({ success: false, message: 'Error al registrar vehículo' });
  }
});

// Check-out endpoint
app.post('/api/vehicles/:id/checkout', (req, res) => {
  const vehicleIndex = vehicles.findIndex(v => v.id === parseInt(req.params.id));
  
  if (vehicleIndex === -1) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }
  
  // Remove vehicle from active list (in real app, would archive it)
  const [removedVehicle] = vehicles.splice(vehicleIndex, 1);
  
  res.json({ 
    success: true, 
    message: 'Check-out completed',
    vehicle: removedVehicle,
    checkoutDate: new Date(),
    notes: req.body.notes
  });
});

// Inspection endpoint
app.post('/api/vehicles/:id/inspection', (req, res) => {
  const vehicle = vehicles.find(v => v.id === parseInt(req.params.id));
  
  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }
  
  const inspection = {
    id: inspections.length + 1,
    vehicleId: vehicle.id,
    date: new Date(),
    inspector: 'Inspector García',
    ...req.body
  };
  
  inspections.push(inspection);
  vehicle.inspections.push(inspection);
  vehicle.status = 'inspection';
  
  // Update task status
  const task = tasks.find(t => t.vehicleId === vehicle.id && t.type === 'inspection');
  if (task) {
    task.status = 'completed';
    task.completedAt = new Date();
  }
  
  res.json({ success: true, data: inspection });
});

// Get inspections
app.get('/api/inspections', (req, res) => {
  res.json({ success: true, data: inspections });
});

// Get tasks
app.get('/api/tasks', (req, res) => {
  res.json({ success: true, data: tasks });
});

// Download checklist template
app.get('/api/checklist-template', async (req, res) => {
  try {
    const templateData = {
      plate: 'XXXX-XX',
      brand: '_________________',
      model: '_________________',
      year: '____',
      color: '_________________',
      owner: '_________________',
      ownerPhone: '_________________',
      ownerEmail: '_________________',
      reason: '_________________',
      notes: '',
      photos: []
    };
    
    const pdfResult = await generateCheckInPDF(templateData);
    res.download(pdfResult.path, 'checklist-template.pdf');
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ success: false, message: 'Error al generar plantilla' });
  }
});

// Update vehicle
app.put('/api/vehicles/:id', (req, res) => {
  const vehicle = vehicles.find(v => v.id === parseInt(req.params.id));
  
  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }
  
  Object.assign(vehicle, req.body);
  res.json({ success: true, data: vehicle });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ✅ Server running on port ${PORT}
  🌐 http://localhost:${PORT}
  
  Login credentials:
  📧 admin@macal.cl
  🔑 MacalAdmin2024
  `);
});