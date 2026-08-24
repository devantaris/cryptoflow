import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Eye } from 'lucide-react';

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
  const [selectedSample, setSelectedSample] = useState<'ct' | 'xray' | 'mri'>('ct');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = 240);
    const height = (canvas.height = 240);

    const bgBase = inverted ? '#f4f4f5' : '#09090b';
    ctx.fillStyle = bgBase;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);

    if (selectedSample === 'ct') {
      // Rib cage
      ctx.beginPath();
      ctx.ellipse(0, 0, 95, 80, 0, 0, Math.PI * 2);
      ctx.strokeStyle = inverted ? `rgba(40, 40, 50, ${0.4 * contrast})` : `rgba(220, 230, 240, ${0.4 * contrast})`;
      ctx.lineWidth = 12;
      ctx.stroke();

      // Spine
      ctx.beginPath();
      ctx.arc(0, 60, 13, 0, Math.PI * 2);
      ctx.fillStyle = inverted ? `rgba(20, 20, 30, ${0.85 * contrast})` : `rgba(255, 255, 255, ${0.85 * contrast})`;
      ctx.fill();

      // Sternum
      ctx.beginPath();
      ctx.arc(0, -70, 7, 0, Math.PI * 2);
      ctx.fillStyle = inverted ? `rgba(30, 30, 40, ${0.8 * contrast})` : `rgba(240, 240, 250, ${0.8 * contrast})`;
      ctx.fill();

      // Lungs
      const drawLung = (isRight: boolean) => {
        ctx.beginPath();
        const xSign = isRight ? -1 : 1;
        ctx.ellipse(xSign * 45, 0, 32, 50, xSign * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = inverted ? `rgba(240, 240, 240, 0.9)` : `rgba(18, 18, 22, 0.95)`;
        ctx.fill();
        ctx.strokeStyle = inverted ? `rgba(60, 60, 70, ${0.25 * contrast})` : `rgba(180, 200, 220, ${0.25 * contrast})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xSign * 25, 5);
        ctx.lineTo(xSign * 55, -20);
        ctx.moveTo(xSign * 25, 10);
        ctx.lineTo(xSign * 58, 25);
        ctx.strokeStyle = inverted ? `rgba(50, 50, 60, ${0.2 * contrast * brightness})` : `rgba(200, 220, 240, ${0.2 * contrast * brightness})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      };

      drawLung(true);
      drawLung(false);

      // Heart
      ctx.beginPath();
      ctx.ellipse(-10, -5, 25, 30, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = inverted ? `rgba(160, 150, 140, ${0.55 * contrast * brightness})` : `rgba(90, 105, 125, ${0.55 * contrast * brightness})`;
      ctx.fill();

      // Nodule on slice 24
      if (slice >= 20 && slice <= 28) {
        const massRadius = (1 - Math.abs(slice - 24) / 10) * 8;
        ctx.beginPath();
        ctx.arc(38, 15, massRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244, 63, 94, ${0.85 * contrast})`;
        ctx.fill();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    } else if (selectedSample === 'xray') {
      // Chest X-Ray PA View Simulation
      ctx.beginPath();
      ctx.ellipse(0, 10, 85, 95, 0, 0, Math.PI * 2);
      ctx.fillStyle = inverted ? `rgba(20, 20, 25, ${0.85 * contrast})` : `rgba(235, 240, 248, ${0.85 * contrast})`;
      ctx.fill();

      // Lung Fields
      const drawXRayLung = (isRight: boolean) => {
        const xSign = isRight ? -1 : 1;
        ctx.beginPath();
        ctx.ellipse(xSign * 38, 15, 28, 65, xSign * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = inverted ? `rgba(230, 230, 235, 0.9)` : `rgba(15, 20, 30, 0.9)`;
        ctx.fill();
        ctx.strokeStyle = inverted ? `rgba(50, 50, 60, ${0.4 * contrast})` : `rgba(180, 200, 220, ${0.4 * contrast})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        for (let r = 0; r < 5; r++) {
          ctx.beginPath();
          ctx.moveTo(xSign * 18, -10 + r * 15);
          ctx.quadraticCurveTo(xSign * 35, -5 + r * 15, xSign * 55, 5 + r * 12);
          ctx.strokeStyle = inverted ? `rgba(80, 80, 90, ${0.3 * contrast})` : `rgba(200, 215, 235, ${0.3 * contrast})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      };

      drawXRayLung(true);
      drawXRayLung(false);

      // Cardiac Silhouette
      ctx.beginPath();
      ctx.ellipse(-12, 25, 28, 38, 0.35, 0, Math.PI * 2);
      ctx.fillStyle = inverted ? `rgba(60, 60, 70, ${0.7 * contrast * brightness})` : `rgba(200, 210, 225, ${0.7 * contrast * brightness})`;
      ctx.fill();

      // Clavicles
      ctx.beginPath();
      ctx.moveTo(-65, -60);
      ctx.quadraticCurveTo(-20, -50, 0, -45);
      ctx.quadraticCurveTo(20, -50, 65, -60);
      ctx.strokeStyle = inverted ? `rgba(30, 30, 40, ${0.8 * contrast})` : `rgba(240, 245, 255, ${0.8 * contrast})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    } else if (selectedSample === 'mri') {
      // Brain MRI Axial View Simulation
      ctx.beginPath();
      ctx.ellipse(0, 0, 80, 95, 0, 0, Math.PI * 2);
      ctx.fillStyle = inverted ? `rgba(30, 30, 35, ${0.8 * contrast})` : `rgba(220, 225, 235, ${0.8 * contrast})`;
      ctx.fill();

      // Brain Parenchyma
      ctx.beginPath();
      ctx.ellipse(0, 0, 70, 85, 0, 0, Math.PI * 2);
      ctx.fillStyle = inverted ? `rgba(220, 220, 225, 0.9)` : `rgba(35, 40, 50, 0.95)`;
      ctx.fill();

      // Interhemispheric Fissure
      ctx.beginPath();
      ctx.moveTo(0, -80);
      ctx.lineTo(0, 80);
      ctx.strokeStyle = inverted ? `rgba(60, 60, 70, 0.6)` : `rgba(160, 175, 195, 0.6)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ventricles
      ctx.beginPath();
      ctx.ellipse(-14, -8, 8, 22, -0.2, 0, Math.PI * 2);
      ctx.ellipse(14, -8, 8, 22, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = inverted ? `rgba(40, 40, 50, ${0.85 * contrast})` : `rgba(215, 230, 250, ${0.85 * contrast * brightness})`;
      ctx.fill();
    }

    ctx.restore();

    ctx.fillStyle = inverted ? '#18181b' : '#a1a1aa';
    ctx.font = '9px "JetBrains Mono", monospace';
    const tag = selectedSample === 'ct' ? `SLICE: ${slice}/48` : selectedSample === 'xray' ? 'CHEST_PA' : 'T2_AXIAL';
    ctx.fillText(tag, 8, 14);
    ctx.fillText(`WW: 350 WL: 40`, 8, 25);
    ctx.fillText(`512x512 DICOM`, 8, height - 8);
    ctx.fillText(selectedSample.toUpperCase(), width - 50, 14);
  }, [slice, contrast, brightness, inverted, selectedSample]);

  return (
    <div className="flex flex-col items-center bg-zinc-950/80 rounded-xl border border-zinc-800 p-3 w-full shadow-inner">
      <div className="flex items-center justify-between w-full mb-2 text-xs font-mono text-zinc-400">
        <span className="text-zinc-200 font-semibold truncate max-w-[150px]">{filename}</span>
        <span className="badge-cyan px-1.5 py-0.5 rounded text-[10px]">
          VIEWPORT
        </span>
      </div>

      {/* Image selector tabs */}
      <div className="flex gap-1 w-full mb-2">
        <button
          onClick={() => setSelectedSample('ct')}
          className={`flex-1 py-1 rounded text-[10px] font-mono transition cursor-pointer ${
            selectedSample === 'ct' ? 'bg-zinc-800 text-white font-medium shadow-sm' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850'
          }`}
        >
          CT Volumetric
        </button>
        <button
          onClick={() => setSelectedSample('xray')}
          className={`flex-1 py-1 rounded text-[10px] font-mono transition cursor-pointer ${
            selectedSample === 'xray' ? 'bg-zinc-800 text-white font-medium shadow-sm' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850'
          }`}
        >
          Chest X-Ray
        </button>
        <button
          onClick={() => setSelectedSample('mri')}
          className={`flex-1 py-1 rounded text-[10px] font-mono transition cursor-pointer ${
            selectedSample === 'mri' ? 'bg-zinc-800 text-white font-medium shadow-sm' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850'
          }`}
        >
          Brain MRI
        </button>
      </div>

      {/* Medical Image Viewport */}
      <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-black shadow-inner">
        <canvas ref={canvasRef} className="block cursor-crosshair" />

        {selectedSample === 'ct' && slice === 24 && (
          <div className="absolute top-2 right-2 bg-rose-500/90 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
            Target Nodule: 2.3cm
          </div>
        )}
      </div>

      {/* Controls for CT view */}
      {selectedSample === 'ct' ? (
        <div className="w-full mt-2.5 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span>Slice</span>
            <input
              type="range"
              min="1"
              max="48"
              value={slice}
              onChange={(e) => setSlice(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded cursor-pointer"
            />
            <span className="w-6 text-right text-zinc-200 font-bold">{slice}</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setInverted(!inverted)}
                className={`p-1 rounded transition cursor-pointer ${inverted ? 'bg-zinc-800 text-white' : 'hover:text-zinc-200'}`}
                title="Invert Grayscale"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setContrast(1.2); setBrightness(1.0); setSlice(24); setInverted(false); }}
                className="p-1 hover:text-zinc-200 rounded transition cursor-pointer"
                title="Reset"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <span>DICOM Axial Series</span>
          </div>
        </div>
      ) : (
        <div className="w-full mt-2 pt-1 border-t border-zinc-800 text-[10px] font-mono text-zinc-400 text-center">
          {selectedSample === 'xray' ? 'NIH Chest X-Ray 14 Sample (1024×1024)' : 'Brain T1-Weighted MRI Plate'}
        </div>
      )}
    </div>
  );
};
