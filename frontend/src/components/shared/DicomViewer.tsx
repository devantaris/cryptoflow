import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Eye, Layers } from 'lucide-react';

interface DicomViewerProps {
  filename?: string;
  onSliceChange?: (slice: number) => void;
}

export const DicomViewer: React.FC<DicomViewerProps> = ({
  filename = 'chest_ct_scan.dcm',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [slice, setSlice] = useState<number>(24);
  const [contrast, setContrast] = useState<number>(1.2);
  const [brightness, setBrightness] = useState<number>(1.0);
  const [inverted, setInverted] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = 240);
    const height = (canvas.height = 240);

    // Deep neutral background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Body contour (oval)
    ctx.save();
    ctx.translate(width / 2, height / 2);

    // Outer rib cage / chest wall
    ctx.beginPath();
    ctx.ellipse(0, 0, 95, 80, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(220, 230, 240, ${0.4 * contrast})`;
    ctx.lineWidth = 12;
    ctx.stroke();

    // Spine (posterior bone)
    ctx.beginPath();
    ctx.arc(0, 60, 13, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * contrast})`;
    ctx.fill();

    // Sternum (anterior bone)
    ctx.beginPath();
    ctx.arc(0, -70, 7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240, 240, 250, ${0.8 * contrast})`;
    ctx.fill();

    // Lungs (left & right parenchyma)
    const drawLung = (isRight: boolean) => {
      ctx.beginPath();
      const xSign = isRight ? -1 : 1;
      ctx.ellipse(xSign * 45, 0, 32, 50, xSign * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = inverted ? `rgba(230, 230, 235, 0.9)` : `rgba(12, 12, 16, 0.95)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(180, 200, 220, ${0.25 * contrast})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Vascular markings
      ctx.beginPath();
      ctx.moveTo(xSign * 25, 5);
      ctx.lineTo(xSign * 55, -20);
      ctx.moveTo(xSign * 25, 10);
      ctx.lineTo(xSign * 58, 25);
      ctx.strokeStyle = `rgba(200, 220, 240, ${0.2 * contrast * brightness})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    };

    drawLung(true);
    drawLung(false);

    // Heart / Mediastinum
    ctx.beginPath();
    ctx.ellipse(-10, -5, 25, 30, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(80, 95, 115, ${0.5 * contrast * brightness})`;
    ctx.fill();

    // Simulated lesion on slice 24
    if (slice >= 20 && slice <= 28) {
      const massRadius = (1 - Math.abs(slice - 24) / 10) * 8;
      ctx.beginPath();
      ctx.arc(38, 15, massRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244, 63, 94, ${0.8 * contrast})`;
      ctx.fill();
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.restore();

    // Medical Overlay Text (DICOM OSD)
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText(`SLICE: ${slice}/48`, 8, 14);
    ctx.fillText(`WW: 350 WL: 40`, 8, 25);
    ctx.fillText(`512x512 DICOM`, 8, height - 8);
    ctx.fillText(`AXIAL_CT`, width - 60, 14);
  }, [slice, contrast, brightness, inverted]);

  return (
    <div className="flex flex-col items-center bg-zinc-950/60 rounded-xl border border-zinc-800/80 p-3 w-full">
      <div className="flex items-center justify-between w-full mb-2 text-xs font-mono text-zinc-400">
        <span className="text-zinc-200 truncate max-w-[150px] font-medium">{filename}</span>
        <span className="bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded text-[10px] border border-zinc-800">
          DICOM v3.0
        </span>
      </div>

      {/* Canvas viewport */}
      <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-black shadow-inner">
        <canvas ref={canvasRef} className="block cursor-crosshair" />
        {slice === 24 && (
          <div className="absolute top-2 right-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9px] font-mono px-1.5 py-0.5 rounded">
            Target Nodule: 2.3cm
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full mt-3 space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <Layers className="w-3.5 h-3.5 text-zinc-500" />
          <span>Slice</span>
          <input
            type="range"
            min="1"
            max="48"
            value={slice}
            onChange={(e) => setSlice(Number(e.target.value))}
            className="w-full accent-blue-500 h-1 bg-zinc-800 rounded cursor-pointer"
          />
          <span className="w-6 text-right text-zinc-200 font-medium">{slice}</span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setInverted(!inverted)}
              className={`p-1 rounded transition cursor-pointer ${inverted ? 'bg-blue-500/20 text-blue-400' : 'hover:text-zinc-300'}`}
              title="Invert Contrast"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setContrast(1.2); setBrightness(1.0); setSlice(24); setInverted(false); }}
              className="p-1 hover:text-zinc-300 rounded transition cursor-pointer"
              title="Reset View"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <span>Axial Series (512×512)</span>
        </div>
      </div>
    </div>
  );
};
