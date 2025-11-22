import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

// IDs de portada y contraportada
const COVER_PAGE_ID = '1jGcJvM4AeN-F_EmvlpJ5myUFs0iJ8NRK';
const BACK_COVER_ID = '1lnW5s-eEqYgDjLcTmQ0ACAFZY85eCOeV';

// Función auxiliar para descargar y agregar un PDF
async function addPdfPages(mergedPdf: PDFDocument, fileId: string, pdfName: string): Promise<boolean> {
  try {
    console.log(`📥 [API] Descargando ${pdfName} con ID: ${fileId}`);
    
    // URL para descargar desde Google Drive (desde el servidor no hay CORS)
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    // Descargar el PDF desde el servidor
    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`❌ [API] Error al descargar ${pdfName} ${fileId}: ${response.status}`);
      return false;
    }

    const arrayBuffer = await response.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    
    // Copiar todas las páginas del PDF al documento combinado
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
    
    console.log(`✅ [API] ${pdfName} agregado exitosamente`);
    return true;
  } catch (error) {
    console.error(`❌ [API] Error al procesar ${pdfName} ${fileId}:`, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fileIds, fileName } = await request.json();

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren IDs de archivos válidos' },
        { status: 400 }
      );
    }

    // Usar el nombre proporcionado o un nombre por defecto
    const pdfFileName = fileName || `propuesta-servicios-${new Date().toISOString().split('T')[0]}.pdf`;

    console.log('📄 [API] Combinando PDFs:', fileIds);

    // Crear un nuevo documento PDF
    const mergedPdf = await PDFDocument.create();

    // 1. Agregar PORTADA al inicio
    await addPdfPages(mergedPdf, COVER_PAGE_ID, 'Portada');

    // 2. Agregar todos los PDFs seleccionados en el medio
    for (const fileId of fileIds) {
      await addPdfPages(mergedPdf, fileId, 'PDF de servicio');
    }

    // 3. Agregar CONTRAPORTADA al final
    await addPdfPages(mergedPdf, BACK_COVER_ID, 'Contraportada');

    // Generar el PDF combinado
    const pdfBytes = await mergedPdf.save();
    
    // Convertir Uint8Array a Buffer para compatibilidad con NextResponse
    const pdfBuffer = Buffer.from(pdfBytes);

    // Devolver el PDF como respuesta
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfFileName}"`,
      },
    });
  } catch (error) {
    console.error('❌ [API] Error al generar PDF combinado:', error);
    return NextResponse.json(
      { error: 'Error al generar el PDF combinado' },
      { status: 500 }
    );
  }
}

