const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateCheckInPDF(vehicleData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      const pdfPath = path.join(__dirname, 'pdfs', `checkin_${vehicleData.plate}_${Date.now()}.pdf`);
      
      // Ensure pdfs directory exists
      if (!fs.existsSync(path.join(__dirname, 'pdfs'))) {
        fs.mkdirSync(path.join(__dirname, 'pdfs'));
      }
      
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);
      
      // Header
      doc.fontSize(24).text('MACAL - CHECKLIST DE INGRESO', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, { align: 'right' });
      doc.moveDown();
      
      // Vehicle Information
      doc.fontSize(16).text('DATOS DEL VEHÍCULO', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Patente: ${vehicleData.plate}`);
      doc.text(`Marca: ${vehicleData.brand}`);
      doc.text(`Modelo: ${vehicleData.model}`);
      doc.text(`Año: ${vehicleData.year}`);
      doc.text(`Color: ${vehicleData.color}`);
      doc.moveDown();
      
      // Owner Information
      doc.fontSize(16).text('DATOS DEL PROPIETARIO', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Nombre: ${vehicleData.owner}`);
      doc.text(`Teléfono: ${vehicleData.ownerPhone || 'No especificado'}`);
      doc.text(`Email: ${vehicleData.ownerEmail || 'No especificado'}`);
      doc.text(`Motivo de Ingreso: ${vehicleData.reason || 'No especificado'}`);
      doc.moveDown();
      
      // Checklist Items
      doc.fontSize(16).text('CHECKLIST DE INSPECCIÓN', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      
      const checklistItems = [
        'EXTERIOR',
        '[ ] Carrocería sin daños',
        '[ ] Pintura en buen estado',
        '[ ] Vidrios sin roturas',
        '[ ] Espejos completos',
        '[ ] Luces funcionando',
        '',
        'INTERIOR',
        '[ ] Asientos en buen estado',
        '[ ] Cinturones funcionando',
        '[ ] Tablero sin daños',
        '[ ] Sistema eléctrico operativo',
        '[ ] Aire acondicionado/Calefacción',
        '',
        'MECÁNICA',
        '[ ] Motor sin fugas',
        '[ ] Niveles de fluidos correctos',
        '[ ] Batería en buen estado',
        '[ ] Sistema de frenos',
        '',
        'NEUMÁTICOS',
        '[ ] Presión adecuada',
        '[ ] Dibujo suficiente',
        '[ ] Sin daños visibles',
        '[ ] Neumático de repuesto',
        '',
        'DOCUMENTACIÓN',
        '[ ] Padrón',
        '[ ] Permiso de circulación',
        '[ ] Seguro vigente',
        '[ ] Revisión técnica'
      ];
      
      checklistItems.forEach(item => {
        doc.text(item);
      });
      
      doc.moveDown();
      
      // Observations
      doc.fontSize(16).text('OBSERVACIONES', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(vehicleData.notes || 'Sin observaciones adicionales');
      doc.moveDown();
      
      // Photo Summary
      if (vehicleData.photos && vehicleData.photos.length > 0) {
        doc.fontSize(16).text('REGISTRO FOTOGRÁFICO', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Total de fotos tomadas: ${vehicleData.photos.length}`);
        
        // Count photos by category
        const photoCategories = {};
        vehicleData.photos.forEach(photo => {
          photoCategories[photo.categoryName] = (photoCategories[photo.categoryName] || 0) + 1;
        });
        
        doc.moveDown(0.5);
        Object.entries(photoCategories).forEach(([category, count]) => {
          doc.text(`- ${category}: ${count} foto(s)`);
        });
      }
      
      // Signatures
      doc.moveDown(2);
      doc.fontSize(12);
      doc.text('_______________________                    _______________________');
      doc.text('    Firma del Cliente                           Firma del Receptor');
      doc.moveDown(0.5);
      doc.text(`    ${vehicleData.owner}                          ${vehicleData.receivedBy || 'MACAL'}`);
      
      // Footer
      doc.fontSize(10);
      doc.text(`Documento generado el ${new Date().toLocaleString('es-CL')}`, 50, doc.page.height - 50, {
        align: 'center'
      });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve({
          success: true,
          path: pdfPath,
          filename: path.basename(pdfPath)
        });
      });
      
      stream.on('error', reject);
      
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateCheckInPDF };