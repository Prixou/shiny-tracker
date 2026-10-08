import { useEffect, useRef, useState } from 'react';
import { ScanLine, CameraOff } from 'lucide-react';
import { Sheet } from '../../ui/ui.jsx';

// Scanner de QR code intégré (BarcodeDetector : Chrome Android, Edge…).
export default function QrScanner({ open, onClose, onResult }) {
  const video = useRef(null);
  const [error, setError] = useState(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    if (!open || !supported) return;
    setError(null);
    let stream = null;
    let raf = null;
    let stopped = false;
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    const scan = async () => {
      if (stopped) return;
      try {
        if (video.current?.readyState >= 2) {
          const codes = await detector.detect(video.current);
          if (codes.length && codes[0].rawValue) {
            stopped = true;
            navigator.vibrate?.(40);
            onResultRef.current(codes[0].rawValue);
            return;
          }
        }
      } catch { /* image pas encore prête */ }
      raf = setTimeout(scan, 250);
    };
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(s => {
        if (stopped) { s.getTracks().forEach(t => t.stop()); return; }
        stream = s;
        video.current.srcObject = s;
        video.current.play().catch(() => {});
        scan();
      })
      .catch(() => setError('Accès à la caméra refusé ou indisponible.'));
    return () => {
      stopped = true;
      clearTimeout(raf);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [open, supported]);

  return (
    <Sheet open={open} onClose={onClose} title="Scanner un QR code" icon={<ScanLine className="w-5 h-5" />}>
      {!supported || error ? (
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <CameraOff className="w-10 h-10 text-slate-500" />
          <p className="text-sm text-slate-300">{error || 'Le scanner intégré n\'est pas pris en charge par ce navigateur.'}</p>
          <p className="text-xs text-slate-500">Utilise l'appareil photo de ton téléphone : le lien ouvrira directement l'app avec l'import.</p>
        </div>
      ) : (
        <div className="relative rounded-3xl overflow-hidden bg-black aspect-square">
          <video ref={video} playsInline muted className="w-full h-full object-cover" />
          <div className="absolute inset-10 border-4 border-amber-400/80 rounded-3xl pointer-events-none" />
        </div>
      )}
    </Sheet>
  );
}
