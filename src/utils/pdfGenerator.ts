import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface WodExercise {
  id: string;
  name: string;
  series: number | string;
  reps: number | string;
  time: number | string;
  imageUrl?: string | null;
}

interface GenerateWodPdfParams {
  date: Date;
  className?: string; // Optional name of the class
  exercises: WodExercise[];
}

export const generateWodPdf = async ({ date, className, exercises }: GenerateWodPdfParams): Promise<Blob> => {
  // Configuración del PDF (A4 Portrait)
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Colores corporativos (ALMODOVAR GROUP) - Adaptados para impresión
  const colors = {
    primary: '#E13038', // Rojo ALMODOVAR
    surface: '#F5F5F5',
    textMain: '#111111',
    textDim: '#555555'
  };

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Función auxiliar para cargar imagen como Data URL en base64 usando fetch
  const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      if (url.startsWith('/')) {
        // Logo local
        const resp = await fetch(url);
        const blob = await resp.blob();
        return new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }

      // Imágen externa (Firebase)
      const resp = await fetch(url);
      const blob = await resp.blob();
      return new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Network/CORS error fetching image for PDF:", e);
      return null;
    }
  };

  // Pre-cargar imágenes de ejercicios y el logo corporativo
  const [logoBase64, ...exerciseImagesBase64] = await Promise.all([
    fetchImageAsBase64('/logo.png'),
    ...exercises.map(ex => ex.imageUrl ? fetchImageAsBase64(ex.imageUrl) : Promise.resolve(null))
  ]);

  // 1. Cabecera (Línea roja fina arriba)
  doc.setFillColor(colors.primary);
  doc.rect(0, 0, pageWidth, 5, 'F');

  let currentY = 20;

  // 2. Logo Grande y Título (Alineación izquierda/centro)
  if (logoBase64) {
    // Logo a la izquierda
    // Calculamos el formato a partir del Data URL
    const formatMatch = logoBase64.match(/data:image\/([a-zA-Z]+);base64,/);
    const imgFormat = formatMatch ? formatMatch[1].toUpperCase() : 'PNG';
    
    doc.addImage(logoBase64, imgFormat, 15, currentY, 40, 40); // 40x40 mm logo
    
    // Título al lado del logo
    doc.setTextColor(colors.textMain);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('ALMODÓVAR GROUP', 60, currentY + 15, { align: 'left' });
    
    // Subtítulo
    doc.setTextColor(colors.textDim);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    const formattedDate = format(date, "EEEE, d 'de' MMMM", { locale: es }).toUpperCase();
    const subtitleText = className ? `${className.toUpperCase()} - ${formattedDate}` : `SESIÓN DEL ${formattedDate}`;
    doc.text(subtitleText, 60, currentY + 25, { align: 'left' });
    
    currentY += 50; // Mover abajo del logo grande
  } else {
    // Si no hay logo (fallback)
    doc.setTextColor(colors.textMain);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('ALMODÓVAR GROUP', pageWidth / 2, currentY + 10, { align: 'center' });
    
    doc.setTextColor(colors.textDim);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    const formattedDate = format(date, "EEEE, d 'de' MMMM", { locale: es }).toUpperCase();
    const subtitleText = className ? `${className.toUpperCase()} - ${formattedDate}` : `SESIÓN DEL ${formattedDate}`;
    doc.text(subtitleText, pageWidth / 2, currentY + 20, { align: 'center' });
    
    currentY += 35;
  }

  // 3. Caja de Ejercicios (Tabla)
  // Utilizaremos jspdf-autotable para renderizar la lista de manera tabular, pero estilizada.
  
  // (Las imágenes ya se cargaron arriba en exerciseImages)

  const tableData = exercises.map((ex, index) => [
    (index + 1).toString(),
    '', // Espacio para la foto
    ex.name.toUpperCase(),
    ex.series ? `${ex.series} series` : '-',
    ex.reps ? `${ex.reps} reps` : '-',
    ex.time ? `${ex.time} min` : '-'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'FOTO', 'EJERCICIO', 'SERIES', 'REPETICIONES', 'TIEMPO']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [225, 48, 56], 
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 10
    },
    styles: {
      fillColor: [255, 255, 255],
      textColor: [17, 17, 17], // Casi negro
      halign: 'center',
      valign: 'middle',
      fontSize: 11,
      cellPadding: 6,
      lineColor: [200, 200, 200], // Gris claro para impresión
      lineWidth: 0.1,
      minCellHeight: 25 // Altura mínima para que quepa la foto
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248] // Gris súper claro
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold', textColor: [225, 48, 56] }, 
      1: { cellWidth: 25, halign: 'center' }, // photo column
      2: { cellWidth: 'auto', halign: 'left', fontStyle: 'bold' }, 
      3: { cellWidth: 25 }, 
      4: { cellWidth: 35 }, 
      5: { cellWidth: 25 }  
    },
    margin: { left: 15, right: 15 },
    didDrawCell: function(data) {
      // Dibujar la imagen en la celda correspondiente (columna 1, en el body)
      if (data.section === 'body' && data.column.index === 1) {
        const imgStr = exerciseImagesBase64[data.row.index];
        if (imgStr) {
          // Centrar la imagen en la celda
          const cellWidth = data.cell.width;
          const cellHeight = data.cell.height;
          // Dimensión cuadrada para la imagen
          const dim = Math.min(cellWidth - 4, cellHeight - 4);
          const x = data.cell.x + (cellWidth - dim) / 2;
          const y = data.cell.y + (cellHeight - dim) / 2;
          
          try {
            const formatMatch = imgStr.match(/data:image\/([a-zA-Z]+);base64,/);
            const imgFormat = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG';
            doc.addImage(imgStr, imgFormat, x, y, dim, dim);
          } catch(e) {
             console.warn("Could not draw exercise image to PDF", e);
          }
        }
      }
    }
  });

  // Footer - Línea roja inferior
  doc.setFillColor(colors.primary);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  
  doc.setTextColor(255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Generado por Almodovar Group App', pageWidth / 2, pageHeight - 3, { align: 'center' });

  // Devolver como Blob (podría enviarse a Storage o descargarse en el cliente)
  return doc.output('blob');
};
