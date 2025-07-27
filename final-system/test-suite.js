// Suite completa de tests para el sistema MACAL
const http = require('http');
const { generateCheckInPDF } = require('./pdf-generator');
const fs = require('fs');

class TestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runAll() {
    console.log('🧪 EJECUTANDO SUITE DE TESTS MACAL INVENTORY SYSTEM');
    console.log('=' .repeat(60));
    
    for (const test of this.tests) {
      try {
        console.log(`\n🔧 Ejecutando: ${test.name}`);
        const result = await test.testFn();
        if (result) {
          console.log(`✅ PASÓ: ${test.name}`);
          this.passed++;
        } else {
          console.log(`❌ FALLÓ: ${test.name}`);
          this.failed++;
        }
      } catch (error) {
        console.log(`❌ ERROR: ${test.name} - ${error.message}`);
        this.failed++;
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESUMEN DE TESTS:');
    console.log(`✅ Pasaron: ${this.passed}`);
    console.log(`❌ Fallaron: ${this.failed}`);
    console.log(`📈 Total: ${this.tests.length}`);
    console.log(`🎯 Tasa de éxito: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
    
    return this.failed === 0;
  }

  makeRequest(options, data) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  }
}

// Crear suite de tests
const suite = new TestSuite();

// Test 1: Servidor funcionando
suite.addTest('Servidor respondiendo', async () => {
  const response = await suite.makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/health',
    method: 'GET'
  });
  
  if (response.statusCode === 200) {
    const data = JSON.parse(response.body);
    return data.status === 'ok';
  }
  return false;
});

// Test 2: Frontend accesible
suite.addTest('Frontend accesible', async () => {
  const response = await suite.makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/',
    method: 'GET'
  });
  
  return response.statusCode === 200 && 
         response.headers['content-type']?.includes('text/html');
});

// Test 3: Generación de PDF
suite.addTest('Generación de PDF', async () => {
  const testData = {
    plate: 'UNIT-TEST',
    brand: 'Test Brand',
    model: 'Test Model',
    year: 2023,
    color: 'Test Color',
    owner: 'Test Owner',
    photos: []
  };
  
  const result = await generateCheckInPDF(testData);
  const exists = fs.existsSync(result.path);
  const stats = exists ? fs.statSync(result.path) : null;
  
  return exists && stats.size > 0;
});

// Test 4: API de autenticación
suite.addTest('API de autenticación', async () => {
  const loginData = JSON.stringify({
    email: 'admin@macal.cl',
    password: 'MacalAdmin2024'
  });
  
  const response = await suite.makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  }, loginData);
  
  if (response.statusCode === 200) {
    const data = JSON.parse(response.body);
    return data.success && data.token && data.user;
  }
  return false;
});

// Test 5: API de vehículos
suite.addTest('API de vehículos', async () => {
  const response = await suite.makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/vehicles',
    method: 'GET'
  });
  
  if (response.statusCode === 200) {
    const data = JSON.parse(response.body);
    return data.success && Array.isArray(data.data);
  }
  return false;
});

// Test 6: Check-in completo con PDF
suite.addTest('Check-in completo con PDF', async () => {
  const checkInData = JSON.stringify({
    plate: 'FULL-TEST',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
    color: 'Blanco',
    owner: 'Test User',
    ownerPhone: '+56912345678',
    ownerEmail: 'test@example.com',
    reason: 'Test completo',
    notes: 'Test del sistema completo',
    photos: [
      {
        category: 'frontal',
        categoryName: 'Frontal',
        url: 'data:image/jpeg;base64,test',
        timestamp: new Date().toISOString()
      }
    ]
  });
  
  const response = await suite.makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/vehicles/checkin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(checkInData)
    }
  }, checkInData);
  
  if (response.statusCode === 200) {
    const data = JSON.parse(response.body);
    return data.success && data.pdfUrl && data.data.id;
  }
  return false;
});

// Test 7: Descarga de plantilla PDF
suite.addTest('Descarga de plantilla PDF', async () => {
  const response = await suite.makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/checklist-template',
    method: 'GET'
  });
  
  return response.statusCode === 200 && 
         response.headers['content-type'] === 'application/pdf';
});

// Test 8: API de tareas
suite.addTest('API de tareas', async () => {
  const response = await suite.makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/tasks',
    method: 'GET'
  });
  
  if (response.statusCode === 200) {
    const data = JSON.parse(response.body);
    return data.success && Array.isArray(data.data);
  }
  return false;
});

// Ejecutar todos los tests
suite.runAll().then(allPassed => {
  if (allPassed) {
    console.log('\n🎉 TODOS LOS TESTS PASARON - SISTEMA FUNCIONANDO CORRECTAMENTE');
  } else {
    console.log('\n⚠️  ALGUNOS TESTS FALLARON - REVISAR FUNCIONALIDADES');
  }
  process.exit(allPassed ? 0 : 1);
});