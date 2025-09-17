import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Cấu hình code splitting cho optimization
    rollupOptions: {
      output: {
        // Manual chunks để tối ưu hóa bundle size
        manualChunks: {
          // Vendor chunks - thư viện bên ngoài
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-cloudinary': ['@cloudinary/react', '@cloudinary/url-gen'],
          // Pages chunks
          'pages-admin': [
            './src/pages/UserManagement/UserManagement.jsx',
            './src/pages/UsersQuizByWeek/UsersQuizByWeek.jsx'
          ],
          'pages-quiz': [
            './src/pages/QuizPlayer/QuizPlayer.jsx', 
            './src/pages/QuizHistory/QuizHistory.jsx',
            './src/pages/Leaderboard/Leaderboard.jsx'
          ],
          'pages-upload': [
            './src/pages/UploadQuiz/Upload.jsx',
            './src/pages/QuizList/QuizzList.jsx'
          ],
          // Utilities
          'utils': [
            './src/utils/cloudinaryUtils.js',
            './src/utils/imageUtils.jsx',
            './src/utils/imageHelpers.js'
          ]
        }
      }
    },
    // Tăng kích thước chunk warning limit
    chunkSizeWarningLimit: 1600,
    // Minify để giảm size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Loại bỏ console.log trong production
        drop_debugger: true
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@cloudinary/react',
      '@cloudinary/url-gen'
    ]
  }
})
