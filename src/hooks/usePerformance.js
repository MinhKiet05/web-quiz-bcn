import { useState, useEffect } from 'react';

/**
 * Custom hook để theo dõi hiệu năng lazy loading
 */
export const usePagePerformance = (pageName) => {
  const [loadTime, setLoadTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const startTime = performance.now();
    
    // Đánh dấu khi component mount xong
    const timer = setTimeout(() => {
      const endTime = performance.now();
      const loadDuration = endTime - startTime;
      
      setLoadTime(loadDuration);
      setIsLoading(false);
      
      // Log performance metrics (chỉ trong development)
      if (import.meta.env.DEV) {
        console.log(`📊 Page Performance: ${pageName}`, {
          loadTime: `${loadDuration.toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [pageName]);

  return { loadTime, isLoading };
};

/**
 * Custom hook để theo dõi lazy loading image
 */
export const useImagePerformance = () => {
  const [stats, setStats] = useState({
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    averageLoadTime: 0
  });

  const recordImageLoad = (loadTime) => {
    setStats(prev => {
      const newLoadedImages = prev.loadedImages + 1;
      const newAverageLoadTime = (prev.averageLoadTime * prev.loadedImages + loadTime) / newLoadedImages;
      
      return {
        ...prev,
        loadedImages: newLoadedImages,
        averageLoadTime: newAverageLoadTime
      };
    });
  };

  const recordImageError = () => {
    setStats(prev => ({
      ...prev,
      failedImages: prev.failedImages + 1
    }));
  };

  const initializeImage = () => {
    setStats(prev => ({
      ...prev,
      totalImages: prev.totalImages + 1
    }));
  };

  const getSuccessRate = () => {
    const { totalImages, loadedImages } = stats;
    return totalImages > 0 ? (loadedImages / totalImages * 100).toFixed(1) : 0;
  };

  return {
    stats,
    recordImageLoad,
    recordImageError,
    initializeImage,
    getSuccessRate
  };
};

/**
 * Hook để optimize bundle loading
 */
export const useBundleOptimization = () => {
  const [bundleInfo, setBundleInfo] = useState({
    chunksLoaded: 0,
    totalSize: 0,
    loadedSize: 0
  });

  useEffect(() => {
    // Theo dõi việc load các chunks trong development
    if (import.meta.env.DEV) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('.js') && entry.name.includes('chunk')) {
            setBundleInfo(prev => ({
              ...prev,
              chunksLoaded: prev.chunksLoaded + 1,
              loadedSize: prev.loadedSize + (entry.transferSize || 0)
            }));
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });

      return () => observer.disconnect();
    }
  }, []);

  return bundleInfo;
};

export default { usePagePerformance, useImagePerformance, useBundleOptimization };