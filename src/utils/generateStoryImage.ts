import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { urlToBase64 } from './imageUtils';

export const generateStoryImage = async (classData: any, coachName: string = 'Coach') => {
    // 1. Create Canvas (1080x1920)
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Background ---
    const grd = ctx.createLinearGradient(0, 0, 0, 1920);
    grd.addColorStop(0, '#121212');
    grd.addColorStop(1, '#000000');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1080, 1920);

    // Optional: Add Noise Texture or subtle pattern could go here

    // --- Header Image (Top 40%) ---
    try {
        const bgUrl = classData.imageUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80";
        const bgBase64 = await urlToBase64(bgUrl);
        const bgImg = new Image();
        bgImg.src = bgBase64;
        await new Promise((resolve) => { bgImg.onload = resolve; bgImg.onerror = resolve; });

        // Draw Image (Cover)
        // Simple cover logic: maintain aspect ratio or just fill top
        const aspect = bgImg.width / bgImg.height;
        const targetHeight = 1080 / aspect;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, 1080, 700);
        ctx.clip();
        // Draw image centered-ish
        ctx.drawImage(bgImg, 0, 0, 1080, Math.max(700, targetHeight));
        // Gradient Overlay
        const overlay = ctx.createLinearGradient(0, 0, 0, 700);
        overlay.addColorStop(0, 'rgba(18,18,18,0.3)');
        overlay.addColorStop(0.7, 'rgba(18,18,18,0.8)');
        overlay.addColorStop(1, '#121212');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, 1080, 700);
        ctx.restore();

    } catch (e) { console.error("BG Image fail", e); }

    // --- Logo ---
    try {
        const logoBase64 = await urlToBase64('/logo_almodovar.png');
        const logoImg = new Image();
        logoImg.src = logoBase64;
        await new Promise((resolve) => { logoImg.onload = resolve; logoImg.onerror = resolve; });
        ctx.drawImage(logoImg, 1080 / 2 - 75, 80, 150, 150);
    } catch (e) {
        // Fallback
        ctx.fillStyle = '#FF1F40';
        ctx.beginPath();
        ctx.arc(1080 / 2, 150, 60, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 80px Helvetica';
        ctx.textAlign = 'center';
        ctx.fillText("A", 1080 / 2, 180);
    }

    // --- Title Area ---
    ctx.textAlign = 'center';

    // Date Pill
    const dateStr = classData.date ? new Date(classData.date).toLocaleDateString() : 'HOY';
    ctx.fillStyle = '#FF1F40';
    ctx.roundRect(1080 / 2 - 150, 260, 300, 50, 25);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Helvetica';
    ctx.fillText(`${dateStr} • ${classData.startTime}`, 1080 / 2, 294);

    // WOD Name
    ctx.font = 'italic 900 80px Helvetica';
    ctx.fillStyle = 'white';
    ctx.fillText((classData.name || 'WOD').toUpperCase(), 1080 / 2, 400);

    // Subtitle
    ctx.font = '900 30px Helvetica';
    ctx.fillStyle = '#666';
    ctx.letterSpacing = "10px"; // Canvas doesn't support this widely, but good for intent
    ctx.fillText("WORKOUT OF THE DAY", 1080 / 2, 450);

    // --- WOD List ---
    let yPos = 600;
    const wodItems = classData.wod || [];

    ctx.textAlign = 'left';

    for (let i = 0; i < wodItems.length && i < 6; i++) { // Limit items to fit
        const item = wodItems[i];

        // Fetch specific exercise image? (Might be too slow/heavy for story, stick to clean text lists or small thumbs)
        // Let's do clean cards

        // Card BG
        ctx.fillStyle = '#1E1E1E';
        ctx.roundRect(100, yPos, 880, 140, 30);
        ctx.fill();

        // Number Badge
        ctx.fillStyle = '#2A2A2A';
        ctx.roundRect(130, yPos + 30, 80, 80, 20);
        ctx.fill();
        ctx.fillStyle = '#FF1F40';
        ctx.font = '900 40px Helvetica';
        ctx.textAlign = 'center';
        ctx.fillText((i + 1).toString(), 170, yPos + 85);

        // Text
        ctx.textAlign = 'left';
        ctx.fillStyle = 'white';
        ctx.font = 'italic 900 40px Helvetica';
        ctx.fillText(item.exerciseName.toUpperCase().substring(0, 25), 240, yPos + 70);

        ctx.fillStyle = '#999';
        ctx.font = 'bold 30px Helvetica';
        let details = "";
        if (item.sets) details += `${item.sets} SETS`;
        if (item.sets && item.reps) details += " • ";
        if (item.reps) details += `${item.reps} REPS`;
        ctx.fillText(details, 240, yPos + 110);

        // Type Pill
        const typeText = (item.exerciseName.match(/run|rem|bici|jump|box|burpee/i)) ? "CARDIO" : "FUERZA";
        const isCardio = typeText === "CARDIO";
        ctx.fillStyle = isCardio ? 'rgba(255, 31, 64, 0.2)' : 'rgba(50, 100, 255, 0.2)';
        ctx.roundRect(830, yPos + 45, 120, 50, 15);
        ctx.fill();
        ctx.fillStyle = isCardio ? '#FF1F40' : '#4dabf7';
        ctx.font = 'bold 20px Helvetica';
        ctx.textAlign = 'center';
        ctx.fillText(typeText, 890, yPos + 78);

        yPos += 170;
    }

    // --- Footer ---
    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Helvetica';
    ctx.textAlign = 'center';
    ctx.fillText("@ALMODOVARBOX", 1080 / 2, 1850);


    // Convert to Image and trigger download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `STORY_${(classData.name || 'WOD').replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
