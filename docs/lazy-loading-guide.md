# Lazy Loading Implementation Guide

## 📚 Tổng quan

Dự án đã được implement lazy loading để tối ưu hiệu năng loading trang web. Bao gồm:

### 1. 🚀 Page-level Lazy Loading
- Sử dụng `React.lazy()` và `Suspense` cho các page components
- Các pages được tách thành chunks riêng biệt
- Loading spinner hiển thị khi đang tải page

### 2. 🖼️ Image Lazy Loading  
- Component `LazyImage` với Intersection Observer
- Component `LazyImageDisplay` tích hợp với existing image utilities
- Chỉ load hình ảnh khi vào viewport
- Placeholder hiển thị trước khi load

### 3. ⚡ Bundle Optimization
- Vite config với manual chunks
- Vendor libraries được tách riêng
- Tree shaking và code splitting
- Minification cho production

## 🛠️ Cách sử dụng

### Lazy Loading cho Pages
```jsx
// App.jsx đã được implement
const Upload = lazy(() => import('./pages/UploadQuiz/Upload'))

<Suspense fallback={<LoadingSpinner message="Đang tải trang..." />}>
  <Routes>
    <Route path="/upload" element={<Upload />} />
  </Routes>
</Suspense>
```

### Lazy Loading cho Images
```jsx
// Sử dụng LazyImage component
import LazyImage from './components/ui/LazyImage'

<LazyImage 
  src="image-url"
  alt="Description"
  placeholder={<div>Custom loading...</div>}
  threshold={0.1}
  rootMargin="50px"
/>

// Hoặc sử dụng LazyImageDisplay (enhanced)
import LazyImageDisplay from './components/ui/LazyImageDisplay'

<LazyImageDisplay 
  url="google-drive-url"
  alt="Description"
  fallbackSrc="backup-url"
  silentMode={false}
/>
```

### Performance Monitoring
```jsx
// Thêm vào page để theo dõi hiệu năng
import PerformanceMonitor from './components/ui/PerformanceMonitor'

function MyPage() {
  return (
    <div>
      <PerformanceMonitor pageName="MyPage" showDetails={true} />
      {/* Page content */}
    </div>
  )
}
```

## 📊 Performance Hooks

```jsx
import { usePagePerformance, useImagePerformance } from './hooks/usePerformance'

function MyComponent() {
  const { loadTime, isLoading } = usePagePerformance('ComponentName')
  const { stats, recordImageLoad } = useImagePerformance()
  
  // Use hooks to track performance
}
```

## 🎯 Lợi ích

### 1. **Improved Initial Load**
- Giảm bundle size của initial page
- Faster First Contentful Paint (FCP)
- Better Time to Interactive (TTI)

### 2. **Better User Experience**
- Progressive loading
- Smooth transitions với loading states
- Reduced bandwidth usage

### 3. **SEO Benefits**
- Faster page load speeds
- Better Core Web Vitals scores
- Improved mobile experience

## 🔧 Configuration

### Vite Config (vite.config.js)
```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'pages-quiz': ['./src/pages/QuizPlayer/QuizPlayer.jsx'],
          // ... more chunks
        }
      }
    }
  }
})
```

### Intersection Observer Settings
```javascript
// LazyImage component
const observerOptions = {
  threshold: 0.1,        // Load khi 10% image vào viewport
  rootMargin: "50px"     // Load trước 50px
}
```

## 🚨 Best Practices

### 1. **Chunk Size Management**
- Tránh tạo quá nhiều chunks nhỏ
- Nhóm related components lại với nhau
- Monitor bundle analyzer

### 2. **Loading States**
- Luôn có meaningful loading indicators
- Consistent loading UI across app
- Handle error states gracefully

### 3. **Image Optimization**
- Sử dụng appropriate image formats
- Implement responsive images
- Consider image preloading cho critical images

### 4. **Testing**
- Test trên slow networks
- Verify chunks được load đúng cách
- Monitor performance metrics

## 📈 Monitoring

### Development Mode
- PerformanceMonitor component hiển thị metrics real-time
- Console logs cho page load times
- Bundle analysis với Vite

### Production Monitoring
- Integrate với analytics tools
- Track Core Web Vitals
- Monitor error rates

## 🔍 Troubleshooting

### Common Issues
1. **Chunks không load**: Kiểm tra network tab trong DevTools
2. **Images không lazy load**: Verify Intersection Observer support
3. **Performance regression**: Use React DevTools Profiler

### Debug Commands
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Test production build locally  
npm run preview
```

## 📱 Mobile Considerations

- Intersection Observer có support tốt trên mobile
- Loading states quan trọng hơn trên slow connections  
- Consider preloading critical resources

---

**Note**: Lazy loading đã được implement và ready to use. Monitor performance để fine-tune theo needs của project.