import React from 'react';
import LazyImage from '../components/ui/LazyImage';
import LazyImageDisplay from '../components/ui/LazyImageDisplay';
import PerformanceMonitor from '../components/ui/PerformanceMonitor';
import { usePagePerformance } from '../hooks/usePerformance';

/**
 * Example page demonstrating lazy loading implementation
 * Để test lazy loading, copy code này vào một page mới
 */
const LazyLoadingDemo = () => {
  const { loadTime, isLoading } = usePagePerformance('LazyLoadingDemo');

  const sampleImages = [
    {
      id: 1,
      url: "https://picsum.photos/400/300?random=1",
      alt: "Sample Image 1"
    },
    {
      id: 2,
      url: "https://picsum.photos/400/300?random=2", 
      alt: "Sample Image 2"
    },
    {
      id: 3,
      url: "https://drive.google.com/file/d/SAMPLE_ID/view", // Google Drive example
      alt: "Google Drive Image"
    },
    {
      id: 4,
      url: "https://picsum.photos/400/300?random=3",
      alt: "Sample Image 3"
    },
    {
      id: 5,
      url: "https://picsum.photos/400/300?random=4",
      alt: "Sample Image 4"
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Performance Monitor - chỉ hiển thị trong dev mode */}
      <PerformanceMonitor pageName="LazyLoadingDemo" showDetails={true} />
      
      <h1>🚀 Lazy Loading Demo</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>📊 Page Performance</h2>
        <p>
          Load time: {isLoading ? 'Loading...' : `${loadTime?.toFixed(2)}ms`}
        </p>
      </div>

      {/* Section 1: Basic Lazy Images */}
      <section style={{ marginBottom: '40px' }}>
        <h2>🖼️ Basic Lazy Images</h2>
        <p>Scroll down để xem lazy loading hoạt động:</p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {sampleImages.slice(0, 3).map((img) => (
            <div key={img.id} style={{ textAlign: 'center' }}>
              <h3>Image {img.id}</h3>
              <LazyImage
                src={img.url}
                alt={img.alt}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
                threshold={0.1}
                rootMargin="100px"
                onLoad={() => console.log(`Image ${img.id} loaded!`)}
                onError={() => console.log(`Image ${img.id} failed to load`)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Enhanced Lazy Images với error handling */}
      <section style={{ marginBottom: '40px' }}>
        <h2>🔧 Enhanced Lazy Images</h2>
        <p>Với error handling và multiple URL fallbacks:</p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {sampleImages.slice(3).map((img) => (
            <div key={img.id} style={{ textAlign: 'center' }}>
              <h3>Enhanced Image {img.id}</h3>
              <LazyImageDisplay
                url={img.url}
                alt={img.alt}
                style={{
                  width: '100%',
                  height: '200px',
                  borderRadius: '8px'
                }}
                fallbackSrc="https://picsum.photos/400/300?random=999"
                silentMode={false}
                threshold={0.2}
                rootMargin="50px"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Performance Tips */}
      <section style={{ marginBottom: '40px' }}>
        <h2>💡 Performance Tips</h2>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3>✅ Best Practices Implemented:</h3>
          <ul>
            <li>🎯 <strong>Intersection Observer</strong>: Chỉ load khi image vào viewport</li>
            <li>⚡ <strong>Root Margin</strong>: Pre-load images trước 50-100px</li>
            <li>🔄 <strong>Fallback URLs</strong>: Multiple sources cho reliability</li>
            <li>🎨 <strong>Smooth Transitions</strong>: Opacity animation khi load</li>
            <li>📊 <strong>Performance Tracking</strong>: Monitor load times và success rates</li>
            <li>🛡️ <strong>Error Handling</strong>: Graceful fallbacks khi image fail</li>
          </ul>

          <h3>🚀 Page-level Lazy Loading:</h3>
          <ul>
            <li>📦 <strong>Code Splitting</strong>: Pages được tách thành chunks riêng</li>
            <li>⏳ <strong>Suspense Boundaries</strong>: Loading states cho từng route</li>
            <li>🔧 <strong>Manual Chunks</strong>: Vendor libraries được optimize</li>
            <li>📈 <strong>Bundle Analysis</strong>: Monitor chunk sizes</li>
          </ul>
        </div>
      </section>

      {/* Section 4: Testing Instructions */}
      <section style={{ marginBottom: '40px' }}>
        <h2>🧪 How to Test</h2>
        <div style={{ 
          background: '#e7f3ff', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #b3d4fc'
        }}>
          <h3>Chrome DevTools:</h3>
          <ol>
            <li>Mở <strong>DevTools</strong> (F12)</li>
            <li>Vào tab <strong>Network</strong></li>
            <li>Throttle connection to <strong>Slow 3G</strong></li>
            <li>Reload page và scroll down</li>
            <li>Observe images loading on-demand</li>
          </ol>

          <h3>Performance Tab:</h3>
          <ol>
            <li>Vào tab <strong>Performance</strong></li>
            <li>Click <strong>Record</strong></li>
            <li>Navigate through pages</li>
            <li>Stop recording và analyze chunks loading</li>
          </ol>

          <h3>Console Logs:</h3>
          <p>Check console cho performance metrics (dev mode only)</p>
        </div>
      </section>

      {/* Spacer để test lazy loading */}
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '18px', color: '#666' }}>
          ⬇️ Scroll down để xem lazy loading hoạt động ⬇️
        </p>
      </div>
    </div>
  );
};

export default LazyLoadingDemo;