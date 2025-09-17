import React from 'react';
import { usePagePerformance, useImagePerformance, useBundleOptimization } from '../../hooks/usePerformance';

const PerformanceMonitor = ({ pageName, showDetails = false }) => {
  const { loadTime, isLoading } = usePagePerformance(pageName);
  const { stats, getSuccessRate } = useImagePerformance();
  const bundleInfo = useBundleOptimization();

  // Chỉ hiển thị trong development mode
  if (!import.meta.env.DEV || !showDetails) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: '200px',
      maxWidth: '300px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        📊 Performance Monitor
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        <strong>Page:</strong> {pageName}
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        <strong>Load Time:</strong> {
          isLoading ? 'Loading...' : `${loadTime?.toFixed(2)}ms`
        }
      </div>
      
      {stats.totalImages > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <strong>Images:</strong> {stats.loadedImages}/{stats.totalImages} 
          ({getSuccessRate()}% success)
        </div>
      )}
      
      {stats.averageLoadTime > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <strong>Avg Image Load:</strong> {stats.averageLoadTime.toFixed(2)}ms
        </div>
      )}
      
      {bundleInfo.chunksLoaded > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <strong>Chunks Loaded:</strong> {bundleInfo.chunksLoaded}
        </div>
      )}
      
      <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '8px' }}>
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default PerformanceMonitor;