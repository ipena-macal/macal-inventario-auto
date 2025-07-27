// Test funcional para verificar la generación de PDF
const { generateCheckInPDF } = require('./pdf-generator');
const fs = require('fs');
const path = require('path');

async function testPDFGeneration() {
  console.log('🧪 Iniciando test de generación de PDF...');
  
  const testVehicleData = {
    plate: 'TEST-123',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
    color: 'Blanco',
    owner: 'Juan Pérez Test',
    ownerPhone: '+56912345678',
    ownerEmail: 'test@example.com',
    reason: 'Mantenimiento',
    notes: 'Vehículo de prueba para test unitario',
    photos: [
      {
        category: 'frontal',
        categoryName: 'Frontal',
        url: 'data:image/jpeg;base64,test',
        timestamp: new Date().toISOString()
      },
      {
        category: 'trasera',
        categoryName: 'Trasera',
        url: 'data:image/jpeg;base64,test',
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    console.log('📝 Generando PDF de prueba...');
    const result = await generateCheckInPDF(testVehicleData);
    
    console.log('✅ PDF generado exitosamente:');
    console.log('  - Archivo:', result.filename);
    console.log('  - Ruta:', result.path);
    
    // Verificar que el archivo existe
    if (fs.existsSync(result.path)) {
      const stats = fs.statSync(result.path);
      console.log('  - Tamaño:', stats.size, 'bytes');
      console.log('  - Fecha:', stats.mtime);
      
      if (stats.size > 0) {
        console.log('✅ Test EXITOSO: PDF generado correctamente');
        return true;
      } else {
        console.log('❌ Test FALLIDO: PDF vacío');
        return false;
      }
    } else {
      console.log('❌ Test FALLIDO: Archivo PDF no encontrado');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test FALLIDO: Error al generar PDF');
    console.error('Error:', error.message);
    return false;
  }
}

// Ejecutar test
testPDFGeneration().then(success => {
  process.exit(success ? 0 : 1);
});