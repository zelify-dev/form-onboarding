import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
// Necesitamos fontkit para embeber fuentes custom, pdf-lib lo requiere
import fontkit from '@pdf-lib/fontkit';

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

// Función auxiliar para dividir texto en líneas
function breakTextIntoLines(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(`${currentLine} ${word}`, size);
    if (width < maxWidth) {
      currentLine += ` ${word}`;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

export async function POST(request: NextRequest) {
  try {
    const { fileIds, fileName, clientName } = await request.json();

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren IDs de archivos válidos' },
        { status: 400 }
      );
    }

    // Usar el nombre proporcionado o un nombre por defecto
    const pdfFileName = fileName || `propuesta-servicios-${new Date().toISOString().split('T')[0]}.pdf`;
    const nameToOverlay = clientName || "Empresa";

    console.log('📄 [API] Combinando PDFs:', fileIds);

    // Crear un nuevo documento PDF
    const mergedPdf = await PDFDocument.create();
    // Registrar fontkit para poder usar fuentas custom (.ttf)
    mergedPdf.registerFontkit(fontkit);

    // Agregar todos los PDFs seleccionados en orden (La Portada ahora viene en fileIds[0])
    for (const fileId of fileIds) {
      await addPdfPages(mergedPdf, fileId, 'PDF de servicio/portada');
    }

    // --- LÓGICA DE TEXT OVERLAY (Superposición de texto) ---
    try {
      // Obtener la primera página (Portada)
      const pages = mergedPdf.getPages();
      if (pages.length > 0) {
        const firstPage = pages[0];

        // Cargar fuente custom Nata Sans
        const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Nata_Sans', 'NataSans-VariableFont_wght.ttf');
        const fontBytes = await fs.readFile(fontPath);
        const customFont = await mergedPdf.embedFont(fontBytes);

        // Definir colores
        const darkBlue = rgb(0.1, 0.1, 0.3); // Color oscuro para texto lateral
        const white = rgb(1, 1, 1);       // Color blanco para pantalla de celular

        // 1. Texto Lateral (Debajo de "CASO DE USO")
        const sideTextSize = 22;
        const sideMaxWidth = 180; // Reducido para evitar salirse del borde derecho
        const sideLines = breakTextIntoLines(nameToOverlay, customFont, sideTextSize, sideMaxWidth);

        let sideY = 460;

        sideLines.forEach((line) => {
          firstPage.drawText(line, {
            x: 400, // Movido a la derecha (era 350) para no solapar el teléfono
            y: sideY,
            size: sideTextSize,
            font: customFont,
            color: darkBlue,
          });
          sideY -= (sideTextSize + 5);
        });

        // 2. Texto en Pantalla de Celular (Inclinado)
        const phoneTextSize = 14;
        const phoneMaxWidth = 180;
        const phoneLines = breakTextIntoLines(nameToOverlay, customFont, phoneTextSize, phoneMaxWidth);

        // Coordenadas base
        const baseX = 150;
        const baseY = 350;
        const lineHeight = phoneTextSize + 4;
        const totalHeight = phoneLines.length * lineHeight;

        // Ajuste vertical para centrar
        let currentY = baseY + (totalHeight / 2);

        phoneLines.forEach((line) => {
          const lineWidth = customFont.widthOfTextAtSize(line, phoneTextSize);
          // Cálculo simple de X para centrar
          // Nota: al estar rotado, el centrado exacto es complejo, pero esto aproxima
          const xOffset = (phoneMaxWidth - lineWidth) / 2;

          firstPage.drawText(line, {
            x: baseX, // Mantenemos base X (ajustar si necesario) e ignoramos xOffset por ahora ya que baseX es inicio
            y: currentY,
            size: phoneTextSize,
            font: customFont,
            color: white,
            rotate: degrees(14),
          });
          currentY -= lineHeight;
        });

        console.log(`✅ [API] Texto "${nameToOverlay}" agregado a la portada con ajustes`);
      }
    } catch (overlayError) {
      console.error("⚠️ [API] Error al agregar texto a la portada (continuando con PDF sin texto):", overlayError);
    }

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
