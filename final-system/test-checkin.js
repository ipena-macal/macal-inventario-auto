// Test funcional del endpoint de check-in
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testCheckInEndpoint() {
  console.log('🧪 Iniciando test funcional de check-in...');
  
  const testData = {
    plate: 'FUNC-TEST',
    brand: 'Honda',
    model: 'Civic',
    year: 2022,
    color: 'Azul',
    owner: 'Test Funcional',
    ownerPhone: '+56999888777',
    ownerEmail: 'funcional@test.com',
    reason: 'Test endpoint',
    notes: 'Test funcional del sistema',
    photos: [
      {
        category: 'frontal',
        categoryName: 'Frontal',
        url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wAA',
        timestamp: new Date().toISOString()
      }
    ]
  };

  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/vehicles/checkin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  try {
    console.log('📡 Enviando request de check-in...');
    const response = await makeRequest(options, postData);
    
    console.log('📊 Respuesta del servidor:');
    console.log('  - Status Code:', response.statusCode);
    console.log('  - Content-Type:', response.headers['content-type']);
    
    if (response.statusCode === 200) {
      const result = JSON.parse(response.body);
      console.log('  - Success:', result.success);
      console.log('  - Vehicle ID:', result.data?.id);
      console.log('  - PDF URL:', result.pdfUrl);
      
      if (result.success && result.pdfUrl) {
        console.log('✅ Test EXITOSO: Check-in funcional con PDF generado');
        
        // Test adicional: verificar que el PDF sea accesible
        const pdfOptions = {
          hostname: 'localhost',
          port: 3001,
          path: result.pdfUrl,
          method: 'GET'
        };
        
        console.log('🔍 Verificando acceso al PDF...');
        const pdfResponse = await makeRequest(pdfOptions);
        
        if (pdfResponse.statusCode === 200) {
          console.log('✅ PDF accesible correctamente');
          console.log('  - Content-Type:', pdfResponse.headers['content-type']);
          console.log('  - Content-Length:', pdfResponse.headers['content-length']);
          return true;
        } else {
          console.log('❌ PDF no accesible:', pdfResponse.statusCode);
          return false;
        }
      } else {
        console.log('❌ Test FALLIDO: Respuesta incorrecta');
        console.log('Response body:', response.body);
        return false;
      }
    } else {
      console.log('❌ Test FALLIDO: Status code', response.statusCode);
      console.log('Response body:', response.body);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test FALLIDO: Error en request');
    console.error('Error:', error.message);
    return false;
  }
}

// Ejecutar test
testCheckInEndpoint().then(success => {
  console.log('\n🏁 Resultado final:', success ? 'TODOS LOS TESTS PASARON' : 'TESTS FALLARON');
  process.exit(success ? 0 : 1);
});