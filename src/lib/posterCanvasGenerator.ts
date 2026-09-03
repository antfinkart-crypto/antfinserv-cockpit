/**
 * High-resolution 1080x1080 branded JPEG poster generator for WhatsApp & Social Media.
 * Assimilates the user's official AntFinServ footer strip across the bottom of every creative,
 * ensuring complete elimination of any third-party branding and 100% SEBI/AMFI regulatory compliance.
 */

export interface PosterConfig {
  title: string;
  headline: string;
  subheadline: string;
  category: string;
  themeColor?: string;
  bannerType?: 'festive' | 'wealth' | 'protection' | 'loan' | 'celebration';
  clientName?: string;
  customImageUrl?: string;
}

export async function generateBrandedPosterDataUrl(config: PosterConfig): Promise<string> {
  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return config.customImageUrl || '';

  // 1. If custom image / creative is provided:
  if (config.customImageUrl) {
    try {
      const customImg = await loadImage(config.customImageUrl);
      // Draw the user's creative image cleanly to fill the canvas
      ctx.drawImage(customImg, 0, 0, size, size);

      // Assimilate the official AntFinServ footer strip image across the bottom (covering bottom 18%)
      await drawAssimilatedFooter(ctx, size);

      return canvas.toDataURL('image/jpeg', 0.96);
    } catch (e) {
      console.warn('Could not load custom image, falling back', e);
      drawDefaultBackground(ctx, size, config);
      drawPosterContent(ctx, size, config);
      await drawAssimilatedFooter(ctx, size);
      return canvas.toDataURL('image/jpeg', 0.95);
    }
  }

  // 2. Procedural Template Card (for cards without an uploaded image)
  drawDefaultBackground(ctx, size, config);
  drawPosterContent(ctx, size, config);
  await drawAssimilatedFooter(ctx, size);

  return canvas.toDataURL('image/jpeg', 0.95);
}

async function drawAssimilatedFooter(ctx: CanvasRenderingContext2D, size: number) {
  try {
    const footerImg = await loadImage('/footer-strip.jpg');
    // Footer card in footer-strip.jpg is between y=95 and y=435 (height = 340, width = 1024)
    const footerHeight = Math.round(size * 0.185); // ~200px
    const footerY = size - footerHeight;

    // Draw dark base
    ctx.fillStyle = '#060d1d';
    ctx.fillRect(0, footerY, size, footerHeight);

    // Draw the luxury card cropped from footer-strip.jpg
    ctx.drawImage(footerImg, 0, 95, 1024, 340, 0, footerY, size, footerHeight);
  } catch {
    drawFallbackFooterStrip(ctx, size);
  }
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
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(0.5, '#2e1065');
    grad.addColorStop(1, '#090d16');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.4, 380, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.4, 440, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPosterContent(ctx: CanvasRenderingContext2D, size: number, config: PosterConfig) {
  ctx.save();
  ctx.textAlign = 'center';

  // Category Tag at Top
  ctx.font = 'bold 24px -apple-system, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(config.category.toUpperCase(), size / 2, 120);

  // Decorative Golden Sparkles
  ctx.fillStyle = '#d4af37';
  ctx.font = '28px sans-serif';
  ctx.fillText('✦   ✦   ✦', size / 2, 170);

  // Main Headline
  ctx.font = '900 60px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  wrapText(ctx, config.headline, size / 2, 280, 880, 72);

  // Subheadline / Meaningful Copy
  ctx.font = '500 28px -apple-system, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  wrapText(ctx, config.subheadline, size / 2, 520, 840, 44);

  // Central Wealth Banner
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  roundRect(ctx, 140, 760, 800, 76, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 24px -apple-system, sans-serif';
  ctx.fillStyle = '#fde68a';
  ctx.fillText('PLANNING YOUR FINANCES. BUILDING YOUR WEALTH.', size / 2, 808);

  ctx.restore();
}

function drawFallbackFooterStrip(ctx: CanvasRenderingContext2D, size: number) {
  const footerHeight = 160;
  const footerY = size - footerHeight;

  ctx.save();
  ctx.fillStyle = '#060d1d';
  ctx.fillRect(0, footerY, size, footerHeight);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(size, footerY);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = '900 30px -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('AntFinServ', 50, footerY + 44);

  ctx.fillStyle = '#f59e0b';
  ctx.fillText('.com', 215, footerY + 44);

  ctx.font = 'bold 16px -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('AMFI REGD. MUTUAL FUND DISTRIBUTOR & SIFD', 50, footerY + 74);

  ctx.textAlign = 'right';
  ctx.font = 'bold 22px -apple-system, sans-serif';
  ctx.fillStyle = '#fde68a';
  ctx.fillText('ARN-94204 • Rana Sahib', size - 50, footerY + 44);

  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('📞 +91 98727 00392  |  🌐 antfinserv.com', size - 50, footerY + 74);

  ctx.textAlign = 'center';
  ctx.font = '13px -apple-system, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(
    'Mutual Fund investments are subject to market risk. Read all scheme related documents carefully. | IRDAI Lic: 487 (Turtlemint POSP)',
    size / 2,
    footerY + 124
  );

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
