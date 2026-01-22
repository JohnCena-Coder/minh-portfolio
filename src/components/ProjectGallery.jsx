import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

export default function ProjectGallery({ images }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Mở ảnh full màn hình
  const openLightbox = (index) => {
    setCurrentIndex(index);
    setIsOpen(true);
    // Khóa cuộn trang web lại
    document.body.style.overflow = 'hidden';
  };

  // Đóng ảnh
  const closeLightbox = () => {
    setIsOpen(false);
    document.body.style.overflow = 'unset';
  };

  // Chuyển ảnh Next/Prev
  const nextImage = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // Xử lý phím tắt (Mũi tên trái/phải, ESC)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Xử lý vuốt trên Mobile
  const minSwipeDistance = 50;
  const onTouchStart = (e) => {
    setTouchEnd(null); 
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
  };

  return (
    <div className="mt-8">
      {/* 1. Lưới ảnh thu nhỏ (Hiển thị dọc hoặc lưới) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((img, idx) => (
          <div key={idx} onClick={() => openLightbox(idx)} className="cursor-zoom-in relative group overflow-hidden rounded-lg bg-gray-100 hover:opacity-95 transition">
             <img src={img} alt={`Gallery ${idx}`} className="w-full h-auto object-cover" loading="lazy" />
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 bg-black/20 text-white">
                <ZoomIn size={32} />
             </div>
          </div>
        ))}
      </div>

      {/* 2. Lightbox (Màn hình đen phóng to) */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex items-center justify-center"
             onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          
          {/* Nút đóng */}
          <button onClick={closeLightbox} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-50">
            <X size={32} />
          </button>

          {/* Nút điều hướng (Chỉ hiện trên PC hoặc màn hình lớn) */}
          <button onClick={prevImage} className="hidden md:block absolute left-4 text-white/50 hover:text-white p-4 transition">
            <ChevronLeft size={48} />
          </button>
          <button onClick={nextImage} className="hidden md:block absolute right-4 text-white/50 hover:text-white p-4 transition">
            <ChevronRight size={48} />
          </button>

          {/* Ảnh chính */}
          <div className="w-full h-full p-4 flex items-center justify-center">
            <img 
                src={images[currentIndex]} 
                alt="Fullview" 
                className="max-w-full max-h-full object-contain select-none shadow-2xl" 
            />
          </div>

          {/* Chỉ số ảnh (Ví dụ: 1/5) */}
          <div className="absolute bottom-6 text-white/60 text-sm tracking-widest font-light">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}