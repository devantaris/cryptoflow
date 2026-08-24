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
    if (selectedSample !== 'ct') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = 240);
    const height = (canvas.height = 240);

    ctx.fillStyle = '#0C0A09';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);

    // Rib cage
    ctx.beginPath();
    ctx.ellipse(0, 0, 95, 80, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(220, 230, 240, ${0.4 * contrast})`;
    ctx.lineWidth = 12;
    ctx.stroke();

    // Spine
    ctx.beginPath();
    ctx.arc(0, 60, 13, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * contrast})`;
    ctx.fill();

    // Sternum
    ctx.beginPath();
    ctx.arc(0, -70, 7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240, 240, 250, ${0.8 * contrast})`;
    ctx.fill();

    // Lungs
    const drawLung = (isRight: boolean) => {
      ctx.beginPath();
      const xSign = isRight ? -1 : 1;
      ctx.ellipse(xSign * 45, 0, 32, 50, xSign * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = inverted ? `rgba(240, 240, 240, 0.9)` : `rgba(18, 18, 22, 0.95)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(180, 200, 220, ${0.25 * contrast})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

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

    // Heart
    ctx.beginPath();
    ctx.ellipse(-10, -5, 25, 30, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(90, 105, 125, ${0.55 * contrast * brightness})`;
    ctx.fill();

    // Nodule on slice 24
    if (slice >= 20 && slice <= 28) {
      const massRadius = (1 - Math.abs(slice - 24) / 10) * 8;
      ctx.beginPath();
      ctx.arc(38, 15, massRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 38, 38, ${0.85 * contrast})`;
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.restore();

    ctx.fillStyle = '#A8A29E';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText(`SLICE: ${slice}/48`, 8, 14);
    ctx.fillText(`WW: 350 WL: 40`, 8, 25);
    ctx.fillText(`512x512 DICOM`, 8, height - 8);
    ctx.fillText(`AXIAL_CT`, width - 60, 14);
  }, [slice, contrast, brightness, inverted, selectedSample]);

  return (
    <div className="flex flex-col items-center bg-[#FAF9F6] rounded-lg border border-[#E7E5E4] p-3 w-full shadow-xs">
      <div className="flex items-center justify-between w-full mb-2 text-xs font-mono text-stone-600">
        <span className="text-stone-900 font-semibold truncate max-w-[150px]">{filename}</span>
        <span className="badge-editorial px-1.5 py-0.5 rounded text-[10px]">
          FIGURE 1A
        </span>
      </div>

      {/* Image selector tabs */}
      <div className="flex gap-1 w-full mb-2">
        <button
          onClick={() => setSelectedSample('ct')}
          className={`flex-1 py-1 rounded text-[10px] font-mono transition cursor-pointer ${
            selectedSample === 'ct' ? 'bg-stone-900 text-stone-100 font-medium' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          CT Volumetric
        </button>
        <button
          onClick={() => setSelectedSample('xray')}
          className={`flex-1 py-1 rounded text-[10px] font-mono transition cursor-pointer ${
            selectedSample === 'xray' ? 'bg-stone-900 text-stone-100 font-medium' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Chest X-Ray
        </button>
        <button
          onClick={() => setSelectedSample('mri')}
          className={`flex-1 py-1 rounded text-[10px] font-mono transition cursor-pointer ${
            selectedSample === 'mri' ? 'bg-stone-900 text-stone-100 font-medium' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Brain MRI
        </button>
      </div>

      {/* Medical Image Viewport */}
      <div className="relative rounded-md overflow-hidden border border-stone-300 bg-black shadow-inner">
        {selectedSample === 'ct' && <canvas ref={canvasRef} className="block cursor-crosshair" />}
        {selectedSample === 'xray' && (
          <img
            src="/medical/chest_xray_sample.png"
            alt="Chest X-Ray Plate"
            className="w-[240px] h-[240px] object-cover block"
          />
        )}
        {selectedSample === 'mri' && (
          <img
            src="/medical/brain_mri_sample.png"
            alt="Brain MRI Plate"
            className="w-[240px] h-[240px] object-cover block"
          />
        )}

        {selectedSample === 'ct' && slice === 24 && (
          <div className="absolute top-2 right-2 bg-red-900/90 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
            Target Nodule: 2.3cm
          </div>
        )}
      </div>

      {/* Controls for CT view */}
      {selectedSample === 'ct' ? (
        <div className="w-full mt-2.5 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-mono text-stone-600">
            <span>Slice</span>
            <input
              type="range"
              min="1"
              max="48"
              value={slice}
              onChange={(e) => setSlice(Number(e.target.value))}
              className="w-full accent-stone-900 h-1 bg-stone-200 rounded cursor-pointer"
            />
            <span className="w-6 text-right text-stone-900 font-bold">{slice}</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-stone-200 text-[10px] font-mono text-stone-500">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setInverted(!inverted)}
                className={`p-1 rounded transition cursor-pointer ${inverted ? 'bg-stone-200 text-stone-900' : 'hover:text-stone-800'}`}
                title="Invert Grayscale"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setContrast(1.2); setBrightness(1.0); setSlice(24); setInverted(false); }}
                className="p-1 hover:text-stone-800 rounded transition cursor-pointer"
                title="Reset"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <span>DICOM Axial Series</span>
          </div>
        </div>
      ) : (
        <div className="w-full mt-2 pt-1 border-t border-stone-200 text-[10px] font-mono text-stone-500 text-center">
          {selectedSample === 'xray' ? 'NIH Chest X-Ray 14 Sample (1024×1024)' : 'Brain T1-Weighted MRI Plate'}
        </div>
      )}
    </div>
  );
};
