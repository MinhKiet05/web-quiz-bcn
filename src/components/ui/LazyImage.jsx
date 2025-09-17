import React, { useState, useEffect, useRef } from 'react';

const LazyImage = ({ 
  src, 
  alt = "Image", 
  className = "", 
  style = {},
  placeholder = null,
  onLoad = () => {},
  onError = () => {},
  threshold = 0.1,
  rootMargin = "50px",
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const imgElement = imgRef.current;
    if (!imgElement) return;

    // Intersection Observer để detect khi image vào viewport
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current.observe(imgElement);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError(e);
  };

  const defaultPlaceholder = (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        color: '#999',
        minHeight: '200px',
        border: '1px dashed #ddd',
        borderRadius: '4px',
        ...style
      }}
      className={className}
    >
      {hasError ? '⚠️ Lỗi tải ảnh' : '📷 Đang tải...'}
    </div>
  );

  return (
    <div ref={imgRef} style={{ position: 'relative' }}>
      {/* Hiển thị placeholder khi chưa load hoặc có lỗi */}
      {(!isLoaded || hasError) && (placeholder || defaultPlaceholder)}
      
      {/* Chỉ load image khi vào viewport */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{
            ...style,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            position: isLoaded ? 'static' : 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;