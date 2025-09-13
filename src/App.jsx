
import './App.css'
import Header from './public/Header'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Upload from './pages/Upload'
import QuizzList from './pages/QuizzList'
import UserManagement from './pages/UserManagement'
import RedirectToHome from './components/RedirectToHome'

const ProtectedRoute = ({ children, requireAdmin = false, requireEditor = false }) => {
  const { user, isAdmin, hasRole } = useAuth();

  if (!user) {
    return <RedirectToHome 
      message="🔒 Cần đăng nhập"
      reason="Bạn cần đăng nhập để truy cập trang này."
    />;
  }

  if (requireAdmin && !isAdmin()) {
    return <RedirectToHome 
      message="⚠️ Không có quyền truy cập"
      reason="Chỉ admin mới có thể truy cập trang này."
    />;
  }

  if (requireEditor && !hasRole('admin') && !hasRole('editor')) {
    return <RedirectToHome 
      message="⚠️ Không có quyền truy cập"
      reason="Chỉ admin và editor mới có thể truy cập trang này."
    />;
  }

  return children;
};

function AppContent() {
  const { loading } = useAuth();

  // Hiển thị loading khi đang khởi tạo authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        background: '#f5f5f5'
      }}>
        <div style={{
          padding: '20px',
          textAlign: 'center',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
          <div>Đang khởi tạo ứng dụng...</div>
          <small style={{ opacity: 0.7 }}>Kiểm tra phiên đăng nhập</small>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={
            <ProtectedRoute requireEditor={true}>
              <Upload />
            </ProtectedRoute>
          } />
          <Route path="/quizz-list" element={
            <ProtectedRoute requireEditor={true}>
              <QuizzList />
            </ProtectedRoute>
          } />
          <Route path="/quizzes" element={
            <ProtectedRoute requireEditor={true}>
              <QuizzList />
            </ProtectedRoute>
          } />
          <Route path="/user-management" element={
            <ProtectedRoute requireAdmin={true}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/my-quizzes" element={
            <ProtectedRoute>
              <MyQuizzes />
            </ProtectedRoute>
          } />
          <Route path="/news" element={<News />} />
          {/* Catch-all route for 404 errors */}
          <Route path="*" element={
            <RedirectToHome 
              message="404: Không tìm thấy trang"
              reason="Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa."
            />
          } />
        </Routes>
      </main>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

// Temporary components cho các route chưa có
const Home = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      {!user && (
        <div style={{
          background: '#fff3e0',
          padding: '20px',
          borderRadius: '8px',
          margin: '20px auto',
          maxWidth: '400px',
          color: '#ef6c00'
        }}>
          <p>Hãy đăng nhập để trải nghiệm đầy đủ tính năng!</p>
        </div>
      )}
      
      <div style={{
        background: 'rgba(23, 23, 23, 0.95)',
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        textAlign: 'left',
        maxWidth: '700px',
        margin: '20px auto',
        lineHeight: 1.6
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>
          {user ? `Xin chào ${user.name} 👋` : 'Hãy đăng nhập để trải nghiệm đầy đủ tính năng!'}
        </h2>
        
        {user ? (
          <>
            <p>
              Ngoài những buổi <b>hướng dẫn C</b> do <b>Ban Công Nghệ</b> tổ chức,
              chúng mình sẽ có thêm một hoạt động thú vị giúp các bạn củng cố kiến thức C:
            </p>
            <p style={{ textAlign: 'center', fontSize: '18px', fontWeight: '600', margin: '12px 0' }}>
              🎯 Tham gia Quiz Hàng Tuần 🎯
            </p>

            <h3>🎲 Thể lệ</h3>
            <ul>
              <li>Mỗi tuần có <b>5 câu quiz</b> (từ dễ → khó).</li>
              <li>Câu 1 → 4: <b>Trắc nghiệm</b>.</li>
              <li>Câu 5: <b>Mức khó nhất</b>, có thể là trắc nghiệm hoặc điền đáp án.</li>
            </ul>

            <h3>👉 Cách tính điểm</h3>
            <ul>
              <li>Mỗi câu đúng sẽ được điểm tương ứng
                (VD: Quiz 1 = 1 điểm, Quiz 5 = 5 điểm).</li>
              <li><b>Tổng điểm</b> các câu = điểm tuần của bạn.</li>
              <li><b>Thứ 2 hàng tuần</b>: Công bố đáp án + Bảng xếp hạng.</li>
            </ul>

            <h3>🏆 Phần thưởng</h3>
            <p>Ban Công Nghệ sẽ tuyên dương <b>Top 3 bạn cao điểm nhất tuần</b>:</p>
            <ul>
              <li>🥇 Top 1: <b>3 Coins</b></li>
              <li>🥈 Top 2: <b>2 Coins</b></li>
              <li>🥉 Top 3: <b>1 Coin</b></li>
            </ul>

            <h3>📌 Lưu ý</h3>
            <p>
              Nếu nhiều bạn bằng điểm trong Top 3 → <b>tất cả đều được thưởng</b>.
              <br />Ví dụ: 2 bạn cùng 15đ (Top 1), 1 bạn 14đ (Top 3).
            </p>
            <p style={{ marginTop: '12px' }}>
              Khi vào Top, các bạn nhắn <b>Minh Kiệt (key bạc)</b> để nhận thưởng nha ✨
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              Đăng nhập để xem thông tin về các quiz và tham gia các hoạt động thú vị!
            </p>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>
              Bạn sẽ có thể tham gia quiz hàng tuần và nhận coins thưởng
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h1>📊 Bảng điều khiển</h1>
    <p>Quản lý quiz và xem thống kê</p>
  </div>
);

const MyQuizzes = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h1>📝 Các quiz tôi tham gia</h1>
    <p>Xem lại các quiz đã làm</p>
  </div>
);

const News = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h1>📰 Tin tức và thông báo quiz</h1>
    <p>Cập nhật mới nhất về quiz</p>
  </div>
);

export default App
