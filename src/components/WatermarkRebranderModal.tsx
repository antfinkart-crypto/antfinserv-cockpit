import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, X, RefreshCw, Wand2, Shield, Image as ImageIcon, Undo2, Check, ArrowRight } from 'lucide-react';
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

  // Settings
  const [replaceTopLogo, setReplaceTopLogo] = useState(true);
  const [topLogoPosition, setTopLogoPosition] = useState<'top-right' | 'top-left'>('top-right');
  const [assimilateFooter, setAssimilateFooter] = useState(true);
  const [footerHeightPct, setFooterHeightPct] = useState(21); // % of total height
  const [brushSize, setBrushSize] = useState(25);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const isMouseDownRef = useRef(false);

  // Load and render when sourceImage or settings change
  useEffect(() => {
    if (!sourceImage || !canvasRef.current) return;
    renderCanvas();
  }, [sourceImage, replaceTopLogo, topLogoPosition, assimilateFooter, footerHeightPct]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
      historyRef.current = [];
    };
    reader.readAsDataURL(file);
  };

  const renderCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceImage) return;

    setIsProcessing(true);
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

    // 3. Assimilate Luxury Bottom Footer if enabled
    if (assimilateFooter) {
      const footerH = Math.round(targetHeight * (footerHeightPct / 100));
      const footerY = targetHeight - footerH;

      // Dark background
      ctx.fillStyle = '#070C18';
      ctx.fillRect(0, footerY, targetWidth, footerH);

      try {
        const footerImg = await loadImage('./footer-strip.jpg');
        // Crop only the card in footer-strip.jpg between y=95 and y=435
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

    setIsProcessing(false);
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

  // Interactive Healing Brush (Click/Drag to remove watermarks)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isMouseDownRef.current = true;
    healAtMousePosition(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDownRef.current) return;
    healAtMousePosition(e);
  };

  const handleCanvasMouseUp = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (historyRef.current.length > 10) historyRef.current.shift();
      }
    }
  };

  const healAtMousePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    const radius = brushSize;

    // Inpaint: sample boundary pixels and blend
    const sampleSize = radius * 2;
    const sx = Math.max(0, x - radius);
    const sy = Math.max(0, y - radius);
    const sw = Math.min(canvas.width - sx, sampleSize);
    const sh = Math.min(canvas.height - sy, sampleSize);

    // Get border pixels outside radius to calculate replacement color
    const imgData = ctx.getImageData(sx, sy, sw, sh);
    const data = imgData.data;

    // Compute average of edge pixels
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

  const handleUndo = () => {
    if (historyRef.current.length > 1) {
      historyRef.current.pop(); // Remove current
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base md:text-lg flex items-center gap-2">
                <span>AI Watermark Cleaner & Rebrander Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  AntFinServ Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Upload any AMC / distributor flyer, erase watermarks, and rebrand with AntFinServ golden luxury strip.
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

        {/* Studio Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* Controls Sidebar (Left) */}
          <div className="lg:col-span-4 p-5 md:p-6 bg-slate-50 border-r border-slate-200 space-y-6 overflow-y-auto">
            {/* Upload Area */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                1. Upload Flyer Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
              />
            </div>

            {sourceImage && (
              <>
                {/* Branding Controls */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    2. AntFinServ Brand Stamping
                  </label>

                  {/* Top Logo Rebranding */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-600" /> Cover Top Logo (ARN-94204)
                      </span>
                      <input
                        type="checkbox"
                        checked={replaceTopLogo}
                        onChange={e => setReplaceTopLogo(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                    </div>
                    {replaceTopLogo && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setTopLogoPosition('top-right')}
                          className={`flex-1 py-1 text-[11px] font-bold rounded-lg border cursor-pointer ${
                            topLogoPosition === 'top-right'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          Top Right
                        </button>
                        <button
                          type="button"
                          onClick={() => setTopLogoPosition('top-left')}
                          className={`flex-1 py-1 text-[11px] font-bold rounded-lg border cursor-pointer ${
                            topLogoPosition === 'top-left'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          Top Left
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Footer Assimilation */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
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
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span>Footer Height:</span>
                          <span className="font-mono font-bold text-slate-800">{footerHeightPct}%</span>
                        </div>
                        <input
                          type="range"
                          min={15}
                          max={35}
                          value={footerHeightPct}
                          onChange={e => setFooterHeightPct(Number(e.target.value))}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Watermark Healing Brush */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-amber-600" /> Watermark Healing Brush
                      </span>
                      <button
                        type="button"
                        onClick={handleUndo}
                        className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold cursor-pointer"
                        title="Undo stroke"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Undo
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Paint over any diagonal watermark in the preview to heal it with background colors.
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">Size:</span>
                      <input
                        type="range"
                        min={10}
                        max={60}
                        value={brushSize}
                        onChange={e => setBrushSize(Number(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono font-bold text-slate-800">{brushSize}px</span>
                    </div>
                  </div>
                </div>

                {/* Campaign Title & Caption */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    3. Save & Publish Details
                  </label>
                  <input
                    type="text"
                    value={cleanTitle}
                    onChange={e => setCleanTitle(e.target.value)}
                    placeholder="Poster Campaign Title"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:border-amber-500"
                  />
                  <textarea
                    rows={3}
                    value={cleanCaption}
                    onChange={e => setCleanCaption(e.target.value)}
                    placeholder="WhatsApp Broadcast Copy..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* Live Interactive Canvas (Right) */}
          <div className="lg:col-span-8 p-6 flex flex-col items-center justify-center bg-slate-950/95 min-h-[450px]">
            {!sourceImage ? (
              <div className="text-center text-slate-400 space-y-3 p-8 border border-dashed border-slate-800 rounded-3xl max-w-md">
                <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="font-bold text-slate-200 text-sm">No Image Uploaded Yet</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Choose or drag an infographic / flyer on the left. The studio will automatically cover watermarks, place ARN-94204, and assimilate the AntFinServ luxury footer!
                </p>
              </div>
            ) : (
              <div className="relative max-h-[70vh] flex flex-col items-center">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className="max-h-[65vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-800 cursor-crosshair active:cursor-grabbing"
                  title="Click and drag to heal watermarks"
                />
                <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Click or drag directly on the flyer to heal any watermark strokes.</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>

          {sourceImage && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-amber-600" />
                <span>Download HD Flyer</span>
              </button>

              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Save to Content Library & WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
