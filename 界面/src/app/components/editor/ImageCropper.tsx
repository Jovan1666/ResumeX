import React, { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Crop } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/app/lib/utils';

/** 支持的裁剪比例 */
type AspectRatioType = '5:7' | '1:1' | '3:4';

interface ImageCropperProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedImage: string) => void;
  aspectRatio?: AspectRatioType;
}

/** 各比例的配置：显示名称、宽高比（宽/高）、输出宽度 */
const ASPECT_CONFIG: Record<AspectRatioType, { label: string; ratio: number; outputWidth: number }> = {
  '5:7': { label: '证件照', ratio: 5 / 7, outputWidth: 295 },   // 标准一寸照 25×35mm → 295×413px
  '1:1': { label: '1:1', ratio: 1, outputWidth: 400 },
  '3:4': { label: '3:4', ratio: 3 / 4, outputWidth: 300 },
};

export const ImageCropper: React.FC<ImageCropperProps> = ({
  image,
  isOpen,
  onClose,
  onCrop,
  aspectRatio: initialAspect = '5:7'
}) => {
  const [zoom, setZoom] = useState(1);               // 相对于自适应缩放的倍数
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>(initialAspect);
  const [isDragging, setIsDragging] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(0);      // 图片自适应裁切区域的基础缩放
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });

  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const maskId = useId();

  const config = ASPECT_CONFIG[aspectRatio];
  const displayScale = baseScale * zoom;
  const imageReady = baseScale > 0;

  // ─── 计算裁切区域（像素），根据容器尺寸和宽高比 ───
  const cropArea = useMemo(() => {
    const { width: cw, height: ch } = containerSize;
    if (cw === 0 || ch === 0) return { width: 0, height: 0, x: 0, y: 0 };

    const padding = 0.72; // 裁切区域占容器的 72%
    const maxW = cw * padding;
    const maxH = ch * padding;

    let w: number, h: number;
    if (maxW / maxH > config.ratio) {
      // 高度受限
      h = maxH;
      w = h * config.ratio;
    } else {
      // 宽度受限
      w = maxW;
      h = w / config.ratio;
    }

    return {
      width: Math.round(w),
      height: Math.round(h),
      x: Math.round((cw - w) / 2),
      y: Math.round((ch - h) / 2),
    };
  }, [containerSize, config.ratio]);

  // ─── 监听容器尺寸变化 ───
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [isOpen]);

  // ─── 图片自适应：让图片刚好覆盖裁切区域 ───
  useEffect(() => {
    if (imageNaturalSize.width === 0 || cropArea.width === 0) return;
    const scaleX = cropArea.width / imageNaturalSize.width;
    const scaleY = cropArea.height / imageNaturalSize.height;
    const fitScale = Math.max(scaleX, scaleY); // 确保完全覆盖裁切区域
    setBaseScale(fitScale);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [imageNaturalSize, cropArea]);

  // ─── 图片加载完成，获取原始尺寸 ───
  const handleImageLoad = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  }, []);

  // ─── 新图片时重置所有状态 ───
  useEffect(() => {
    if (image) {
      setImageNaturalSize({ width: 0, height: 0 });
      setBaseScale(0);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [image]);

  // ─── 鼠标滚轮缩放 ───
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom(prev => {
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      return Math.max(1, Math.min(3, +(prev + delta).toFixed(2)));
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isOpen, handleWheel]);

  // ─── 拖拽：鼠标 ───
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  // ─── 拖拽：触摸 ───
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
  };

  // ─── 绑定 document 级别的拖拽事件 ───
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

    const handleEnd = () => setIsDragging(false);

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

  // ─── 执行裁切 ───
  const handleCrop = () => {
    if (!imageRef.current || cropArea.width === 0 || !imageReady) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const { width: cw, height: ch } = containerSize;

    // 输出尺寸
    const outputWidth = config.outputWidth;
    const outputHeight = Math.round(outputWidth / config.ratio);
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // 计算图片在容器中的显示位置和大小
    const imgDisplayW = img.naturalWidth * displayScale;
    const imgDisplayH = img.naturalHeight * displayScale;
    const imgX = (cw - imgDisplayW) / 2 + position.x;
    const imgY = (ch - imgDisplayH) / 2 + position.y;

    // 映射裁切区域到原始图片坐标
    const sourceX = (cropArea.x - imgX) / displayScale;
    const sourceY = (cropArea.y - imgY) / displayScale;
    const sourceW = cropArea.width / displayScale;
    const sourceH = cropArea.height / displayScale;

    // 白色背景（防止透明图片）
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    ctx.drawImage(
      img,
      sourceX, sourceY, sourceW, sourceH,
      0, 0, outputWidth, outputHeight
    );

    const croppedImage = canvas.toDataURL('image/jpeg', 0.92);
    onCrop(croppedImage);
    onClose();
  };

  const resetPosition = () => {
    setZoom(1);
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
            {/* 标题栏 */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <div className="flex items-center gap-2 text-white">
                <Crop size={20} />
                <span className="font-medium">裁切照片</span>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            {/* 裁切区域 */}
            <div
              ref={containerRef}
              className="flex-1 relative overflow-hidden cursor-move bg-gray-950"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {/* 图片 */}
              <img
                ref={imageRef}
                src={image}
                alt="Crop"
                className="absolute top-1/2 left-1/2 max-w-none select-none"
                style={{
                  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${displayScale})`,
                  transformOrigin: 'center',
                  opacity: imageReady ? 1 : 0,
                  transition: 'opacity 0.2s ease-in',
                }}
                draggable={false}
                onLoad={handleImageLoad}
              />

              {/* 加载中指示器 */}
              {!imageReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}

              {/* 裁切遮罩层 */}
              {cropArea.width > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* 暗色遮罩，中间挖空 */}
                  <svg
                    className="w-full h-full"
                    viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
                  >
                    <defs>
                      <mask id={`crop-mask-${maskId}`}>
                        <rect width={containerSize.width} height={containerSize.height} fill="white" />
                        <rect
                          x={cropArea.x}
                          y={cropArea.y}
                          width={cropArea.width}
                          height={cropArea.height}
                          rx="4"
                          fill="black"
                        />
                      </mask>
                    </defs>
                    <rect
                      width={containerSize.width}
                      height={containerSize.height}
                      fill="rgba(0,0,0,0.6)"
                      mask={`url(#crop-mask-${maskId})`}
                    />
                  </svg>

                  {/* 裁切边框 + 九宫格辅助线 */}
                  <div
                    className="absolute border-2 border-white/90 rounded"
                    style={{
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                    }}
                  >
                    {/* 九宫格 */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="border border-white/20" />
                      ))}
                    </div>
                    {/* 四角标记 */}
                    {[
                      'top-0 left-0 border-t-[3px] border-l-[3px]',
                      'top-0 right-0 border-t-[3px] border-r-[3px]',
                      'bottom-0 left-0 border-b-[3px] border-l-[3px]',
                      'bottom-0 right-0 border-b-[3px] border-r-[3px]',
                    ].map((cls, i) => (
                      <div
                        key={i}
                        className={`absolute w-4 h-4 border-white ${cls}`}
                      />
                    ))}
                  </div>

                  {/* 比例标签 */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bg-black/60 text-white/70 text-xs px-2 py-0.5 rounded"
                    style={{ top: cropArea.y + cropArea.height + 8 }}
                  >
                    {config.label}
                    {aspectRatio === '5:7' && ' (25×35mm)'}
                  </div>
                </div>
              )}
            </div>

            {/* 控制栏 */}
            <div className="p-4 bg-gray-800 space-y-4">
              {/* 比例选择 */}
              <div className="flex justify-center gap-2">
                {(Object.keys(ASPECT_CONFIG) as AspectRatioType[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setAspectRatio(key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      aspectRatio === key
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    )}
                  >
                    {ASPECT_CONFIG[key].label}
                  </button>
                ))}
              </div>

              {/* 缩放控制 */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setZoom(prev => Math.max(1, +(prev - 0.1).toFixed(2)))}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={zoom <= 1}
                >
                  <ZoomOut size={18} />
                </button>

                <div className="flex items-center gap-2 w-40">
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-white text-sm w-12">{Math.round(zoom * 100)}%</span>
                </div>

                <button
                  onClick={() => setZoom(prev => Math.min(3, +(prev + 0.1).toFixed(2)))}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={zoom >= 3}
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

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCrop}
                  disabled={!imageReady}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
