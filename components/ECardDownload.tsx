'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

interface ECardDownloadProps {
  imageUrl: string;
  fileName?: string;
}

export default function ECardDownload({
  imageUrl,
  fileName = 'e-card.png',
}: ECardDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    const ua = navigator.userAgent || navigator.vendor || '';
    const isAndroid = /android/i.test(ua);
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isIAB = /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger/i.test(ua);

    if (isAndroid && isIAB) {
      window.location.href =
        'intent://' +
        window.location.host +
        window.location.pathname +
        window.location.search +
        '#Intent;scheme=https;end;';
      return;
    }

    if (isIOS && isIAB) {
      window.open(imageUrl, '_blank');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(imageUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="w-full gold-gradient text-white font-semibold py-3.5 rounded-xl text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
    >
      <Download className="w-4 h-4" />
      {isDownloading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด E-Card'}
    </button>
  );
}
