import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, RefreshCcw, ScanLine, Loader2, RotateCcw, Check } from 'lucide-react';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export function ScannerModal({ onClose, onScan, isScanning }: { onClose: () => void, onScan: (img: string) => void, isScanning: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        alert("Akses kamera ditolak. Berikan izin kamera untuk menggunakan fitur ini.");
        onClose();
      }
    }
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Scanner ini full-screen - biar kamera kelihatan sampai mentok ke atas (nggak ada
  // gap hitam dari area status bar), overlay WebView sementara selama modal ini terbuka.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    return () => {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    };
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col">
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {!capturedImage ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {/* Visual Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4/5 aspect-[3/4] border-2 border-white/50 rounded-2xl relative">
                {/* Corners */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blu-primary rounded-tl-xl"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blu-primary rounded-tr-xl"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blu-primary rounded-bl-xl"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blu-primary rounded-br-xl"></div>
                
                {/* Scanning Animation Line */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-x-0 top-0 animate-[scan_2.2s_ease-in-out_infinite]">
                    <div className="h-16 bg-gradient-to-t from-white/50 to-transparent"></div>
                    <div className="h-[3px] bg-white shadow-[0_0_16px_3px_rgba(255,255,255,0.95)]"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-10 left-0 right-0 text-center px-6">
              <p className="text-white font-medium text-sm bg-black/40 backdrop-blur-md py-2 px-4 rounded-full inline-block">
                Luruskan struk di dalam kotak agar tidak buram
              </p>
            </div>
          </>
        ) : (
          <img src={capturedImage} className="w-full h-full object-contain" alt="Captured" />
        )}

        {isScanning && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-4">
            <Loader2 className="animate-spin text-blu-primary" size={48} />
            <div className="text-center">
              <p className="text-lg font-bold">Memproses Struk...</p>
              <p className="text-sm opacity-70">AI sedang mengekstrak data transaksi</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-black p-8 flex justify-between items-center">
        <button 
          onClick={onClose}
          className="p-4 text-white/70 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {!capturedImage ? (
          <button 
            onClick={capture}
            className="w-20 h-20 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center p-1"
          >
            <div className="w-full h-full border-4 border-white/20 rounded-full flex items-center justify-center">
              <div className="w-14 h-14 bg-blu-primary rounded-full"></div>
            </div>
          </button>
        ) : (
          <div className="flex gap-6">
            <button 
              onClick={() => setCapturedImage(null)}
              className="w-16 h-16 bg-white dark:bg-gray-900/10 text-white rounded-full flex items-center justify-center hover:bg-white dark:bg-gray-900/20"
            >
              <RotateCcw size={24} />
            </button>
            <button 
              onClick={() => onScan(capturedImage)}
              className="w-16 h-16 bg-blu-primary text-white rounded-full flex items-center justify-center hover:bg-blu-dark"
            >
              <Check size={28} />
            </button>
          </div>
        )}

        <div className="w-12 h-12"></div> {/* Spacer */}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
