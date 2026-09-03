import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Download,
  X,
  Wand2,
  Shield,
  Image as ImageIcon,
  Undo2,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Upload,
  Layers,
  Palette
} from 'lucide-react';
import { ContentPost } from './ContentStudioView';

interface WatermarkRebranderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToLibrary: (post: ContentPost) => void;
}

export const WatermarkRebranderModal: React.FC<WatermarkRebranderModalProps> = ({
  isOpen,
  onClose,
  onSaveToLibrary
}) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [cleanTitle, setCleanTitle] = useState('Awareness Campaign Flyer');
  const [cleanCaption, setCleanCaption] = useState(
    'Small financial habits lead to monumental wealth. Start your disciplined journey with AntFinServ today!'
  );

  // Rebranding Settings
  const [replaceTopLogo, setReplaceTopLogo] = useState(true);
  const [topLogoPosition, setTopLogoPosition] = useState<'top-right' | 'top-left'>('top-right');
  const [assimilateFooter, setAssimilateFooter] = useState(true);
  const [footerHeightPct, setFooterHeightPct] = useState(21); // % of total height

  // Watermark Healing Brush
  const [brushSize, setBrushSize] = useState(20);

  // Zoom Controls
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, 1.5 = 150%, 2 = 200%, etc.

  // AntFinServ Protective Watermark Overlay
  const [enableBrandWatermark, setEnableBrandWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('ANTFINSERV.COM • ARN-94204');
  const [watermarkOpacity, setWatermarkOpacity] = useState(10); // 5% to 30%
  const [watermarkColor, setWatermarkColor] = useState<'gold' | 'white' | 'dark'>('gold');

  // Badge Tool
  const [enableCoverBadge, setEnableCoverBadge] = useState(false);
  const [badgeTitle, setBadgeTitle] = useState('DISCIPLINED MICRO-SIP');
  const [badgeMain, setBadgeMain] = useState('1 Cup Chai = 1 Crore');
  const [badgeSub, setBadgeSub] = useState('Small Daily Habit, Monumental Future');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const isMouseDownRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load and render when sourceImage or settings change
  useEffect(() => {
    if (!sourceImage || !canvasRef.current) return;
    renderCanvas();
  }, [
    sourceImage,
    replaceTopLogo,
    topLogoPosition,
    assimilateFooter,
    footerHeightPct,
    enableBrandWatermark,
    watermarkText,
    watermarkOpacity,
    watermarkColor,
    enableCoverBadge,
    badgeTitle,
    badgeMain,
    badgeSub
  ]);

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
      historyRef.current = [];
      setZoomLevel(1);
    };
    reader.readAsDataURL(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const renderCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceImage) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sourceImage;

    await new Promise(resolve => {
      img.onload = resolve;
    });

    // Standardize width to 1080 for crisp HD output
    const targetWidth = 1080;
    const targetHeight = Math.round(img.naturalHeight * (targetWidth / img.naturalWidth));

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 1. Draw source image
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // 2. Cover legacy top logo if enabled
    if (replaceTopLogo) {
      const boxW = 320;
      const boxH = 140;
      const boxX = topLogoPosition === 'top-right' ? targetWidth - boxW - 20 : 20;
      const boxY = 20;

      // Sample background color near the box
      const sampleX = topLogoPosition === 'top-right' ? boxX - 10 : boxX + boxW + 10;
      const pixel = ctx.getImageData(sampleX, boxY + 30, 1, 1).data;
      ctx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
      ctx.fillRect(boxX, boxY, boxW, boxH);

      // Load and draw AntFinServ emblem
      try {
        const emblemImg = await loadImage('./emblem-logo.jpg');
        const emblemSize = 100;
        const emblemX = topLogoPosition === 'top-right' ? targetWidth - emblemSize - 35 : 35;
        ctx.drawImage(emblemImg, emblemX, boxY + 20, emblemSize, emblemSize);
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.strokeRect(emblemX, boxY + 20, emblemSize, emblemSize);

        // Draw ARN-94204 Pill
        const pillX = topLogoPosition === 'top-right' ? emblemX - 180 : emblemX + emblemSize + 15;
        const pillY = boxY + 38;
        ctx.fillStyle = '#FAF6EB';
        ctx.fillRect(pillX, pillY, 165, 52);
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.strokeRect(pillX, pillY, 165, 52);

        ctx.fillStyle = '#3C280A';
        ctx.font = 'bold 20px Segoe UI, sans-serif';
        ctx.fillText('ARN-94204', pillX + 18, pillY + 33);
      } catch (err) {
        console.warn('Could not render emblem overlay', err);
      }
    }

    // 3. Optional Cover Badge Tool (to permanently neutralize unremovable watermarks)
    if (enableCoverBadge) {
      const badgeX = 75;
      const badgeY = Math.round(targetHeight * 0.48);
      const badgeW = 355;
      const badgeH = 145;

      ctx.save();
      // Soft shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      roundRect(ctx, badgeX - 4, badgeY + 5, badgeW + 8, badgeH + 6, 26);
      ctx.fill();

      // Badge Card
      ctx.fillStyle = '#FFFDF8';
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 22);
      ctx.fill();
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Badge Typography
      ctx.fillStyle = '#B45309';
      ctx.font = 'bold 15px Segoe UI, sans-serif';
      ctx.fillText(badgeTitle, badgeX + 24, badgeY + 30);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 22px Segoe UI, sans-serif';
      ctx.fillText(badgeMain, badgeX + 22, badgeY + 66);

      ctx.fillStyle = '#64748B';
      ctx.font = '15px Segoe UI, sans-serif';
      ctx.fillText(badgeSub, badgeX + 24, badgeY + 105);
      ctx.restore();
    }

    // 4. AntFinServ Protective Diagonal Watermark Overlay
    if (enableBrandWatermark) {
      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((-30 * Math.PI) / 180);

      const alpha = watermarkOpacity / 100;
      let colorStr = `rgba(212, 175, 55, ${alpha})`; // Gold
      if (watermarkColor === 'white') colorStr = `rgba(255, 255, 255, ${alpha * 1.5})`;
      if (watermarkColor === 'dark') colorStr = `rgba(15, 23, 42, ${alpha})`;

      ctx.fillStyle = colorStr;
      ctx.font = 'bold 18px Segoe UI, sans-serif';
      ctx.textAlign = 'center';

      for (let y = -targetHeight; y <= targetHeight; y += 180) {
        for (let x = -targetWidth; x <= targetWidth; x += 360) {
          ctx.fillText(watermarkText, x, y);
        }
      }
      ctx.restore();
    }

    // 5. Assimilate Luxury Bottom Footer if enabled
    if (assimilateFooter) {
      const footerH = Math.round(targetHeight * (footerHeightPct / 100));
      const footerY = targetHeight - footerH;

      ctx.fillStyle = '#070C18';
      ctx.fillRect(0, footerY, targetWidth, footerH);

      try {
        const footerImg = await loadImage('./footer-strip.jpg');
        ctx.drawImage(
          footerImg,
          0, 95, footerImg.naturalWidth, 340,
          15, footerY + 10, targetWidth - 30, footerH - 20
        );
      } catch (err) {
        console.warn('Could not render footer strip', err);
      }
    }

    // Save initial state to history for undo
    if (historyRef.current.length === 0) {
      historyRef.current.push(ctx.getImageData(0, 0, targetWidth, targetHeight));
    }
  };

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  // Interactive Healing Brush (Mouse & Touch Events)
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY)
    };
  };

  const healAtCoords = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = brushSize;
    const sampleSize = radius * 2;
    const sx = Math.max(0, x - radius);
    const sy = Math.max(0, y - radius);
    const sw = Math.min(canvas.width - sx, sampleSize);
    const sh = Math.min(canvas.height - sy, sampleSize);

    const imgData = ctx.getImageData(sx, sy, sw, sh);
    const data = imgData.data;

    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let py = 0; py < sh; py++) {
      for (let px = 0; px < sw; px++) {
        if (px === 0 || px === sw - 1 || py === 0 || py === sh - 1) {
          const idx = (py * sw + px) * 4;
          rSum += data[idx];
          gSum += data[idx + 1];
          bSum += data[idx + 2];
          count++;
        }
      }
    }

    if (count > 0) {
      const rAvg = Math.round(rSum / count);
      const gAvg = Math.round(gSum / count);
      const bAvg = Math.round(bSum / count);

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${rAvg}, ${gAvg}, ${bAvg})`;
      ctx.fill();
      ctx.restore();
    }
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isMouseDownRef.current = true;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    healAtCoords(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDownRef.current) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    healAtCoords(x, y);
  };

  const handleMouseUp = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      pushHistory();
    }
  };

  // Touch handlers (for Mobile Phones & Tablets)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isMouseDownRef.current = true;
      const t = e.touches[0];
      const { x, y } = getCanvasCoords(t.clientX, t.clientY);
      healAtCoords(x, y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isMouseDownRef.current && e.touches.length === 1) {
      e.preventDefault(); // Prevent scrolling while painting
      const t = e.touches[0];
      const { x, y } = getCanvasCoords(t.clientX, t.clientY);
      healAtCoords(x, y);
    }
  };

  const handleTouchEnd = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      pushHistory();
    }
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (historyRef.current.length > 12) historyRef.current.shift();
    }
  };

  const handleUndo = () => {
    if (historyRef.current.length > 1) {
      historyRef.current.pop();
      const prev = historyRef.current[historyRef.current.length - 1];
      const canvas = canvasRef.current;
      if (canvas && prev) {
        const ctx = canvas.getContext('2d');
        ctx?.putImageData(prev, 0, 0);
      }
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `AntFinServ_${cleanTitle.replace(/\s+/g, '_')}.jpg`;
    link.click();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
    const post: ContentPost = {
      id: `CUSTOM-REBRAND-${Date.now()}`,
      title: cleanTitle,
      category: 'Mutual Funds',
      date: 'Rebranded Awareness Flyer',
      tags: ['#AntFinServ', '#AwarenessCampaign', '#WealthCreation'],
      views: 0,
      bannerType: 'wealth',
      headline: cleanTitle,
      subheadline: 'Official educational flyer from AntFinServ.',
      defaultCaption: cleanCaption,
      customImageUrl: dataUrl,
      isCustom: true
    };

    onSaveToLibrary(post);
    onClose();
    alert('Rebranded flyer published to Content Library successfully! You can now send it to clients via WhatsApp.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base md:text-lg flex items-center gap-2">
                <span>AI Watermark Cleaner & Rebrander Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  AntFinServ Pro
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Erase competitor watermarks, zoom in to pixel-heal, stamp AntFinServ luxury branding & protective security overlays.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Controls Panel (Left) */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-slate-50 border-r border-slate-200 space-y-5 overflow-y-auto max-h-[80vh]">
            {/* 1. Mobile-Optimized Upload Button */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                1. Select Flyer Image
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileInputChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 text-amber-950 font-bold text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all shadow-xs"
              >
                <Upload className="w-5 h-5 text-amber-600" />
                <span>{sourceImage ? 'Change / Upload New Flyer' : 'Tap to Upload from Phone or PC'}</span>
                <span className="text-[10px] text-amber-800/80 font-normal">Supports Camera, Gallery, JPG & PNG</span>
              </button>
            </div>

            {sourceImage && (
              <>
                {/* 2. Precision Healing Brush Controls */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-amber-600" /> Healing Brush
                    </span>
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="text-[11px] text-slate-600 hover:text-slate-950 flex items-center gap-1 font-semibold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer"
                      title="Undo last stroke"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Undo
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Zoom into corners and paint over any watermark to dissolve it into surrounding pixels.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">Size:</span>
                    <input
                      type="range"
                      min={4}
                      max={70}
                      value={brushSize}
                      onChange={e => setBrushSize(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-800 w-8 text-right">
                      {brushSize}px
                    </span>
                  </div>
                </div>

                {/* 3. AntFinServ Protective Watermark Overlay (NEW!) */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-600" /> AntFinServ Security Watermark
                    </span>
                    <input
                      type="checkbox"
                      checked={enableBrandWatermark}
                      onChange={e => setEnableBrandWatermark(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Adds a subtle repeating AntFinServ watermark across the asset to neutralize residual competitor marks.
                  </p>
                  {enableBrandWatermark && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={e => setWatermarkText(e.target.value)}
                        placeholder="Watermark Text"
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-amber-500"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Opacity:</span>
                        <span className="font-mono font-bold text-slate-800">{watermarkOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={30}
                        value={watermarkOpacity}
                        onChange={e => setWatermarkOpacity(Number(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5 pt-1">
                        {(['gold', 'white', 'dark'] as const).map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setWatermarkColor(c)}
                            className={`flex-1 py-1 text-[10px] font-bold rounded-lg border capitalize cursor-pointer ${
                              watermarkColor === c
                                ? 'bg-amber-100 text-amber-950 border-amber-300'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Luxury Callout Cover Badge (NEW!) */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Branded Cover Badge
                    </span>
                    <input
                      type="checkbox"
                      checked={enableCoverBadge}
                      onChange={e => setEnableCoverBadge(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Stamps a stylish marketing callout badge directly over difficult watermarks.
                  </p>
                  {enableCoverBadge && (
                    <div className="space-y-1.5 pt-1">
                      <input
                        type="text"
                        value={badgeTitle}
                        onChange={e => setBadgeTitle(e.target.value)}
                        placeholder="Badge Eyebrow (e.g. DISCIPLINED MICRO-SIP)"
                        className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 font-bold focus:outline-none"
                      />
                      <input
                        type="text"
                        value={badgeMain}
                        onChange={e => setBadgeMain(e.target.value)}
                        placeholder="Badge Headline (e.g. 1 Cup Chai = 1 Crore)"
                        className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 font-bold focus:outline-none"
                      />
                      <input
                        type="text"
                        value={badgeSub}
                        onChange={e => setBadgeSub(e.target.value)}
                        placeholder="Badge Subtitle"
                        className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* 5. Top Logo & Bottom Footer Rebranding */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-600" /> Replace Top Logo
                    </span>
                    <input
                      type="checkbox"
                      checked={replaceTopLogo}
                      onChange={e => setReplaceTopLogo(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                  {replaceTopLogo && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setTopLogoPosition('top-right')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-lg border cursor-pointer ${
                          topLogoPosition === 'top-right'
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Top Right
                      </button>
                      <button
                        type="button"
                        onClick={() => setTopLogoPosition('top-left')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-lg border cursor-pointer ${
                          topLogoPosition === 'top-left'
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Top Left
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Luxury AntFinServ Footer
                    </span>
                    <input
                      type="checkbox"
                      checked={assimilateFooter}
                      onChange={e => setAssimilateFooter(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                  {assimilateFooter && (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Footer Height:</span>
                        <span className="font-mono font-bold text-slate-800">{footerHeightPct}%</span>
                      </div>
                      <input
                        type="range"
                        min={14}
                        max={35}
                        value={footerHeightPct}
                        onChange={e => setFooterHeightPct(Number(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* 6. Campaign Details */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    Publish Details
                  </label>
                  <input
                    type="text"
                    value={cleanTitle}
                    onChange={e => setCleanTitle(e.target.value)}
                    placeholder="Poster Campaign Title"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:border-amber-500"
                  />
                  <textarea
                    rows={2}
                    value={cleanCaption}
                    onChange={e => setCleanCaption(e.target.value)}
                    placeholder="WhatsApp Broadcast Copy..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* Live Canvas Viewport (Right) with Precision Zoom */}
          <div className="lg:col-span-8 bg-slate-950 flex flex-col relative overflow-hidden">
            {/* Zoom & Navigation Floating Bar */}
            {sourceImage && (
              <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-lg text-white">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-all active:scale-95"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-amber-400">
                    {Math.round(zoomLevel * 100)}%
                  </span>

                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.min(3.5, prev + 0.25))}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-all active:scale-95"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="text-[11px] font-semibold px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 ml-1 cursor-pointer"
                  >
                    Reset (100%)
                  </button>
                </div>

                <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1 hidden sm:flex">
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Zoom in to 200%+ to paint fine corners & watermarks</span>
                </div>
              </div>
            )}

            {/* Scrollable Canvas Container */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center min-h-[400px]">
              {!sourceImage ? (
                <div className="text-center text-slate-400 space-y-3 p-6 sm:p-10 border border-dashed border-slate-800 rounded-3xl max-w-md">
                  <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
                  <h4 className="font-bold text-slate-200 text-sm">No Image Selected</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tap the upload button on the left to select any flyer from your phone or PC.
                  </p>
                </div>
              ) : (
                <div
                  className="transition-transform duration-100 flex items-center justify-center"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top center'
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="max-h-[68vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-800 cursor-crosshair active:cursor-grabbing touch-none select-none"
                    title="Touch or click and drag to heal watermarks"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>

          {sourceImage && (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleDownload}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Download</span> HD Flyer
              </button>

              <button
                onClick={handleSave}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Save to Library & WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
