/**
 * Generates a high-resolution 1080x1080 branded JPEG poster for WhatsApp / Social Media
 * Includes AntFinServ branding, gold accents, mascot logo, and AMFI ARN-94204 footer strip
 */

export interface PosterConfig {
  title: string;
  headline: string;
  subheadline: string;
  category: string;
  themeColor?: string;
  bgGradient?: [string, string, string];
  bannerType?: 'festive' | 'wealth' | 'protection' | 'loan' | 'celebration';
  clientName?: string;
  customImageUrl?: string;
}

export async function generateBrandedPosterDataUrl(config: PosterConfig): Promise<string> {
  const canvas = document.createElement('canvas');
  const size = 1080;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Background
  if (config.customImageUrl) {
    // If custom image uploaded, draw it as background
    try {
      const customImg = await loadImage(config.customImageUrl);
      ctx.drawImage(customImg, 0, 0, size, size);
      // Draw subtle dark overlay for text contrast
      ctx.fillStyle = 'rgba(11, 19, 43, 0.4)';
      ctx.fillRect(0, 0, size, size);
    } catch {
      drawDefaultBackground(ctx, size, config);
    }
  } else {
    drawDefaultBackground(ctx, size, config);
  }

  // 2. Thematic Graphics & Typography
  drawPosterContent(ctx, size, config);

  // 3. Official AntFinServ Footer Strip
  drawFooterStrip(ctx, size);

  return canvas.toDataURL('image/jpeg', 0.95);
}

function drawDefaultBackground(ctx: CanvasRenderingContext2D, size: number, config: PosterConfig) {
  const grad = ctx.createLinearGradient(0, 0, size, size);
  if (config.bannerType === 'festive') {
    grad.addColorStop(0, '#0a1128');
    grad.addColorStop(0.5, '#1c1917');
    grad.addColorStop(1, '#0c0a09');
  } else if (config.bannerType === 'wealth') {
    grad.addColorStop(0, '#06201b');
    grad.addColorStop(0.5, '#0b132b');
    grad.addColorStop(1, '#051622');
  } else if (config.bannerType === 'protection') {
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#090d16');
  } else if (config.bannerType === 'loan') {
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(0.5, '#0b132b');
    grad.addColorStop(1, '#1e293b');
  } else {
    // celebration
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(0.5, '#2e1065');
    grad.addColorStop(1, '#090d16');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Decorative gold circles / geometric aura
  ctx.save();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.42, 380, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.42, 440, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPosterContent(ctx: CanvasRenderingContext2D, size: number, config: PosterConfig) {
  ctx.save();
  ctx.textAlign = 'center';

  // Category Tag at Top
  ctx.font = 'bold 24px -apple-system, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.letterSpacing = '3px';
  ctx.fillText(config.category.toUpperCase(), size / 2, 120);

  // Decorative Golden Sparkles / Arch
  ctx.fillStyle = '#d4af37';
  ctx.font = '32px sans-serif';
  ctx.fillText('✦   ✦   ✦', size / 2, 170);

  // Main Headline (e.g. "Navroz Mubarak!" or "Invest In Their Future")
  ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  wrapText(ctx, config.headline, size / 2, 290, 880, 76);

  // Subheadline / Meaningful Copy
  ctx.font = '500 32px -apple-system, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  wrapText(ctx, config.subheadline, size / 2, 540, 840, 48);

  // Personalized Client Name Callout if present
  if (config.clientName) {
    ctx.font = 'italic bold 28px -apple-system, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Specially crafted for ${config.clientName}`, size / 2, 780);
  }

  // Central Wealth Call-to-action or Motive
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  roundRect(ctx, 140, 810, 800, 90, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 26px -apple-system, sans-serif';
  ctx.fillStyle = '#fde68a';
  ctx.fillText('PLANNING YOUR FINANCES. BUILDING YOUR WEALTH.', size / 2, 866);

  ctx.restore();
}

function drawFooterStrip(ctx: CanvasRenderingContext2D, size: number) {
  const footerHeight = 130;
  const footerY = size - footerHeight;

  // Solid dark navy footer background with gold top border
  ctx.save();
  ctx.fillStyle = '#060d1d';
  ctx.fillRect(0, footerY, size, footerHeight);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(size, footerY);
  ctx.stroke();

  // Left side: AntFinServ Logo Text
  ctx.textAlign = 'left';
  ctx.font = '900 32px -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('AntFinServ', 60, footerY + 50);

  ctx.fillStyle = '#f59e0b';
  ctx.fillText('.com', 230, footerY + 50);

  ctx.font = 'bold 18px -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('AMFI REGD. MUTUAL FUND DISTRIBUTOR & SIFD', 60, footerY + 84);

  // Right side: ARN & Contact
  ctx.textAlign = 'right';
  ctx.font = 'bold 22px -apple-system, sans-serif';
  ctx.fillStyle = '#fde68a';
  ctx.fillText('ARN-94204 • Rana Sahib', size - 60, footerY + 50);

  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('📞 +91 98727 00392  |  🌐 antfinserv.com', size - 60, footerY + 84);

  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
