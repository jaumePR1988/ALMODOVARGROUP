// @ts-ignore
import { jsPDF } from 'jspdf';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const urlToBase64 = async (url: string, useProxy = false): Promise<string> => {
    try {
        const fetchUrl = useProxy
            ? `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
            : url;

        const response = await fetch(fetchUrl, { mode: 'cors' });
        if (!response.ok) throw new Error('Network response was not ok');

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        if (!useProxy) {
            console.warn("Direct image fetch failed, retrying with proxy:", error);
            return urlToBase64(url, true);
        }

        console.warn("Proxy image fetch failed too, trying canvas fallback:", error);
        // Fallback to Canvas method
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = url;
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg'));
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = () => reject(new Error('Canvas image load failed'));
        });
    }
};

export const generateWodPdf = async (classData: any, coachName: string = 'Coach') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- 1. HEADER (Black) ---
    doc.setFillColor(12, 12, 12);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo
    try {
        const logoImg = new Image();
        logoImg.src = '/logo_almodovar.png';
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve;
        });
        doc.addImage(logoImg, 'PNG', 12, 4, 32, 32);
    } catch (e) {
        // Fallback Circle 'A'
        doc.setFillColor(255, 31, 64);
        doc.circle(25, 20, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(30);
        doc.setFont("helvetica", "bold");
        doc.text("A", 25, 29, { align: "center", baseline: "bottom" });
    }

    // Brand Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("ALMODOVAR BOX", 52, 22);

    // Subtitle (Red)
    doc.setTextColor(255, 31, 64);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TRAINING SESSION REPORT", 45, 27, { charSpace: 1.5 });

    // --- 2. INFO BAR (Darker Strip) ---
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 40, pageWidth, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text((classData.name || 'WOD').toUpperCase(), 15, 47);

    // Date & Coach
    const dateStr = classData.date ? new Date(classData.date).toLocaleDateString() : 'HOY';
    doc.text(`${dateStr}   |   ${classData.startTime} - ${classData.endTime}   |   ${coachName}`, pageWidth - 15, 47, { align: 'right' });

    // --- 3. SECTION TITLE ---
    const startY = 65;
    // Red Lines
    doc.setDrawColor(220, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(15, startY, 70, startY);
    doc.line(140, startY, pageWidth - 15, startY);

    doc.setTextColor(12, 12, 12);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PROGRAMACIÓN WOD", pageWidth / 2, startY + 2, { align: "center" });

    // --- 4. WOD CARDS ---
    let yPos = startY + 15;
    const wodItems = classData.wod || [];

    for (let i = 0; i < wodItems.length; i++) {
        const item = wodItems[i];

        // Fetch Image
        let imgData = null;
        if (item.exerciseId) {
            try {
                const exDoc = await getDoc(doc(db, 'exercises', item.exerciseId));
                if (exDoc.exists() && exDoc.data().imageUrl) {
                    imgData = await urlToBase64(exDoc.data().imageUrl);
                }
            } catch (e) { }
        }

        // Card Container
        doc.setDrawColor(230, 230, 230);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(15, yPos, pageWidth - 30, 24, 3, 3, 'FD');

        // Image
        if (imgData) {
            try {
                doc.addImage(imgData, 'JPEG', 18, yPos + 3, 18, 18, undefined, 'FAST');
            } catch (err) { }
        } else {
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(18, yPos + 3, 18, 18, 2, 2, 'F');
        }

        // Exercise Name
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(item.exerciseName, 42, yPos + 10);

        // Badges
        const typeText = (item.exerciseName.match(/run|rem|bici|jump|box|burpee/i)) ? "CARDIO" : "FUERZA";
        const badgeColor = typeText === "CARDIO" ? [255, 235, 235] : [235, 240, 255];
        const textColor = typeText === "CARDIO" ? [255, 50, 50] : [50, 50, 200];

        doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
        doc.roundedRect(pageWidth - 35, yPos + 4, 16, 6, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(typeText, pageWidth - 27, yPos + 8, { align: "center" });

        // Pills
        let pillX = 42;
        const drawPill = (label: string, value: string) => {
            const text = `${value} ${label}`;
            doc.setFillColor(255, 245, 235);
            doc.roundedRect(pillX, yPos + 13, 20, 6, 1, 1, 'F');
            doc.setTextColor(200, 100, 0);
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.text(text, pillX + 10, yPos + 17, { align: "center" });
            pillX += 24;
        };

        if (item.sets) drawPill("SER.", item.sets);
        if (item.reps) drawPill("REPS", item.reps);

        yPos += 30;

        if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 20;
        }
    }

    // --- 5. FOOTER ---
    const footerY = pageHeight - 30;
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.roundedRect(15, footerY, pageWidth - 30, 15, 2, 2, 'S');
    doc.setLineDashPattern([], 0);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "italic");
    doc.text('"No pain, no gain. Let\'s crush this session!"', pageWidth / 2, footerY + 6, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 31, 64);
    doc.text("• ALMODOVAR BOX •", pageWidth / 2, footerY + 11, { align: "center" });

    doc.save(`WOD_${(classData.name || 'WOD').replace(/\s+/g, '_')}.pdf`);
};
