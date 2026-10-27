import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Camera, AlertCircle, X } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function QrScan() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [reader, setReader] = useState(null);

  const startScan = async () => {
    setError(null);
    setScanning(true);
    try {
      const codeReader = new BrowserMultiFormatReader();
      setReader(codeReader);
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (devices.length === 0) { setError('No camera found on this device'); setScanning(false); return; }
      codeReader.decodeFromVideoDevice(undefined, 'qr-video', (result, err) => {
        if (result) {
          const text = result.getText();
          stopScan();
          if (text.includes('/qr/table/')) {
            const token = text.split('/qr/table/')[1];
            navigate(`/qr/table/${token}`);
          } else if (text.includes('/track/')) {
            const token = text.split('/track/')[1];
            navigate(`/track/${token}`);
          } else if (text.includes('/qr/order/')) {
            const token = text.split('/qr/order/')[1];
            navigate(`/track/${token}`);
          } else {
            setError('Unrecognized QR code. Please scan a FoodieHub QR code.');
          }
        }
      });
    } catch (err) {
      setError('Could not access camera. Please check permissions and try again.');
      setScanning(false);
    }
  };

  const stopScan = () => {
    if (reader) { reader.reset(); setReader(null); }
    setScanning(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-charcoal-900 text-white p-4">
      <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
        <QrCode className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-extrabold font-display mb-2">Scan QR Code</h1>
      <p className="text-sm text-ink-300 text-center mb-6 max-w-sm">Scan a restaurant table QR to view the menu, or an order QR to track your order.</p>

      {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-300 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}

      {scanning && (
        <div className="relative w-full max-w-sm">
          <video id="qr-video" className="w-full rounded-xl bg-black" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-orange-400 rounded-xl" />
          </div>
          <button onClick={stopScan} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
      )}

      {!scanning && (
        <button onClick={startScan} className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600">
          <Camera className="w-5 h-5" /> Start Camera
        </button>
      )}
    </div>
  );
}
