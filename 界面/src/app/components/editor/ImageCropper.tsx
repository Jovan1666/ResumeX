import React, { useState, useRef, useEffect, useId } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Crop } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/app/lib/utils';

interface ImageCropperProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedImage: string) => void;
  aspectRatio?: 'free' | '1:1' | '3:4';
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  image,
  isOpen,
  onClose,
  onCrop,
  aspectRatio: initialAspect = '1:1'
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = useState(initialAspect);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const maskId = useId();

  const getAspectValue = () => {
    switch (aspectRatio) {
      case '1:1': return 1;
      case '3:4': return 3 / 4;
      default: return 1;
    }
  };

  // 切换图片时重置缩放和位移状态
  useEffect(() => {
    if (image) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [image]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  // 触摸事件支持（移动端）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
  };

  // 将 mousemove/mouseup 和 touchmove/touchend 绑定到 document 上
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStartRef.current.x,
        y: touch.clientY - dragStartRef.current.y,
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const handleCrop = () => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropSize = 200;
    const aspectValue = getAspectValue();
    
    canvas.width = cropSize;
    canvas.height = cropSize / aspectValue;

    const img = imageRef.current;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // 计算裁切区域
    const cropAreaSize = Math.min(containerRect.width, containerRect.height) * 0.7;
    const cropX = (containerRect.width - cropAreaSize) / 2;
    const cropY = (containerRect.height - cropAreaSize / aspectValue) / 2;

    // 计算图片在容器中的实际位置和大小
    const imgDisplayWidth = img.naturalWidth * scale;
    const imgDisplayHeight = img.naturalHeight * scale;
    const imgX = (containerRect.width - imgDisplayWidth) / 2 + position.x;
    const imgY = (containerRect.height - imgDisplayHeight) / 2 + position.y;

    // 计算源图片裁切区域
    const sourceX = (cropX - imgX) / scale;
    const sourceY = (cropY - imgY) / scale;
    const sourceWidth = cropAreaSize / scale;
    const sourceHeight = (cropAreaSize / aspectValue) / scale;

    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, canvas.width, canvas.height
    );

    // 压缩图片
    const croppedImage = canvas.toDataURL('image/jpeg', 0.85);
    onCrop(croppedImage);
    onClose();
  };

  const resetPosition = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-gray-900 rounded-2xl z-50 md:w-[500px] md:h-[600px] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <div className="flex items-center gap-2 text-white">
                <Crop size={20} />
                <span className="font-medium">裁切照片</span>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            {/* Crop Area */}
            <div 
              ref={containerRef}
              className="flex-1 relative overflow-hidden cursor-move bg-gray-950"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {/* Image */}
              <img
                ref={imageRef}
                src={image}
                alt="Crop"
                className="absolute top-1/2 left-1/2 max-w-none select-none"
                style={{
                  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'center'
                }}
                draggable={false}
              />

              {/* Crop Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Dark overlay with hole */}
                <svg className="w-full h-full">
                  <defs>
                    <mask id={`crop-mask-${maskId}`}>
                      <rect x="0" y="0" width="100%" height="100%" fill="white" />
                      <rect
                        x="50%"
                        y="50%"
                        width="70%"
                        height={aspectRatio === '3:4' ? '93.3%' : '70%'}
                        rx="8"
                        fill="black"
                        style={{ transform: 'translate(-50%, -50%)' }}
                      />
                    </mask>
                  </defs>
                  <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.6)"
                    mask={`url(#crop-mask-${maskId})`}
                  />
                </svg>

                {/* Crop border */}
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-lg"
                  style={{
                    width: '70%',
                    height: aspectRatio === '3:4' ? '93.3%' : '70%'
                  }}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="border border-white/20" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 bg-gray-800 space-y-4">
              {/* Aspect Ratio */}
              <div className="flex justify-center gap-2">
                {(['1:1', '3:4', 'free'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      aspectRatio === ratio
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    )}
                  >
                    {ratio === 'free' ? '自由' : ratio}
                  </button>
                ))}
              </div>

              {/* Zoom & Reset */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                >
                  <ZoomOut size={18} />
                </button>
                
                <div className="flex items-center gap-2 w-40">
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-white text-sm w-12">{Math.round(scale * 100)}%</span>
                </div>
                
                <button
                  onClick={() => setScale(Math.min(3, scale + 0.1))}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                >
                  <ZoomIn size={18} />
                </button>
                
                <button
                  onClick={resetPosition}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                  title="重置"
                >
                  <RotateCw size={18} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCrop}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  确认裁切
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
