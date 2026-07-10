-- Khởi tạo các Enum (Giúp tối ưu dung lượng và chặt chẽ dữ liệu)
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'student');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE quiz_type_enum AS ENUM ('normal', 'weekly');
CREATE TYPE quiz_status AS ENUM ('draft', 'active', 'inactive');
CREATE TYPE question_type_enum AS ENUM ('mcq', 'fill_text');
CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'timeout');

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Bảng users
CREATE TABLE users (
    mssv VARCHAR(20) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role user_role NOT NULL,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Bảng categories
CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Insert sẵn 3 category mặc định
INSERT INTO categories (name) VALUES ('C/C++'), ('Mobile (Java)'), ('Web (HTML/CSS/JavaScript)');

-- 3. Bảng quizzes
CREATE TABLE quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty difficulty_level NOT NULL,
    quiz_type quiz_type_enum NOT NULL,
    duration INTEGER NOT NULL, -- Tính bằng phút
    total_questions INTEGER DEFAULT 0,
    status quiz_status DEFAULT 'draft',
    weekly_start TIMESTAMP,
    weekly_end TIMESTAMP,
    thumbnail VARCHAR(255),
    created_by VARCHAR(20) REFERENCES users(mssv),
    updated_by VARCHAR(20) REFERENCES users(mssv),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Bảng questions
CREATE TABLE questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    code_snippet TEXT, -- Chứa mã nguồn để frontend dùng highlight.js/prismjs
    explanation TEXT, -- Lời giải thích khi xem lại bài
    question_type question_type_enum NOT NULL,
    display_order INTEGER NOT NULL,
    weight INTEGER DEFAULT 1
);

-- 5. Bảng answers
CREATE TABLE answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL, -- Dùng cho cả Multiple Choice (text option) và Fill Text (chuỗi đáp án tuyệt đối)
    is_correct BOOLEAN DEFAULT FALSE,
    display_order INTEGER NOT NULL
);

-- 6. Bảng attempts
CREATE TABLE attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(mssv) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_questions INTEGER,
    completion_time INTEGER, -- Tính bằng giây
    started_at TIMESTAMP DEFAULT NOW(),
    submitted_at TIMESTAMP,
    status attempt_status DEFAULT 'in_progress',
    is_weekly_attempt BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- UNIQUE PARTIAL INDEX: Chống gian lận 1 phiên làm bài
CREATE UNIQUE INDEX one_active_attempt_per_user 
ON attempts (user_id, quiz_id) 
WHERE status = 'in_progress';

-- 7. Bảng attempt_answers
CREATE TABLE attempt_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer_id UUID REFERENCES answers(id) ON DELETE SET NULL,
    fill_text_answer TEXT,
    is_correct BOOLEAN
);



--  RLS
-- Bật RLS cho tất cả các bảng
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- POLICIES CHO BẢNG QUIZZES
-- 1. Ai cũng có thể xem các Quiz đang "Active"
CREATE POLICY "Public read active quizzes" 
ON quizzes FOR SELECT 
USING (status = 'active');

-- 2. Chỉ Admin và Editor mới có thể xem Quiz nháp (Draft/Inactive) và thực hiện CRUD
-- (Trong thực tế bạn sẽ check role từ JWT auth.jwt()->>'role', ở đây minh họa logic logic)
CREATE POLICY "Admin/Editor CRUD quizzes" 
ON quizzes FOR ALL 
USING (
  (SELECT role FROM users WHERE mssv = current_setting('request.jwt.claims', true)::json->>'mssv') IN ('admin', 'editor')
);

-- --------------------------------------------------------
-- POLICIES CHO BẢNG ATTEMPTS (Sinh viên chỉ thao tác được với phiên thi của mình)
-- 1. Sinh viên chỉ xem được lịch sử (attempts) của chính mình
CREATE POLICY "Users read own attempts" 
ON attempts FOR SELECT 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'mssv');

-- 2. Sinh viên có thể tạo mới (Insert) và nộp bài (Update) phiên của chính mình
CREATE POLICY "Users manage own attempts" 
ON attempts FOR ALL 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'mssv');

-- --------------------------------------------------------
-- POLICIES CHO BẢNG ANSWERS (Chặn soi đáp án)
-- Câu lệnh này chặn việc lấy trực tiếp bảng answers trừ khi bạn là Admin/Editor 
-- hoặc (nâng cao hơn) chỉ cho phép Student SELECT những câu trả lời thuộc về bài thi đã NỘP.
CREATE POLICY "Hide answers from active students" 
ON answers FOR SELECT 
USING (
  -- Nếu là Admin/Editor thì được xem
  (SELECT role FROM users WHERE mssv = current_setting('request.jwt.claims', true)::json->>'mssv') IN ('admin', 'editor')
  -- (Phần logic cho phép sinh viên xem đáp án sau khi nộp bài thường sẽ được gọi qua một RPC (Database function) 
  -- có quyền SECURITY DEFINER để bypass RLS một cách có kiểm soát, thay vì mở thẳng bảng ở đây).
);

-- --------------------------------------------------------
-- AUTH RPC
-- Xác thực MSSV + mật khẩu và trả về hồ sơ người dùng để frontend hiển thị sidebar.
CREATE OR REPLACE FUNCTION public.login_user(p_mssv VARCHAR, p_password TEXT)
RETURNS TABLE (
    mssv VARCHAR,
    full_name VARCHAR,
    email VARCHAR,
    role user_role,
    last_login TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    WITH matched_user AS (
        SELECT u.mssv, u.full_name, u.email, u.role, u.last_login
        FROM users u
        WHERE u.mssv = p_mssv
            AND u.is_active = TRUE
            AND u.password_hash = p_password
        LIMIT 1
    ), updated_user AS (
        UPDATE users u
        SET last_login = NOW()::timestamp,
            updated_at = NOW()::timestamp
        WHERE u.mssv IN (SELECT mu.mssv FROM matched_user mu)
        RETURNING u.mssv, u.full_name, u.email, u.role, u.last_login
    )
        SELECT mu.mssv, mu.full_name, mu.email, mu.role, COALESCE(uu.last_login, NOW()::timestamp)
    FROM matched_user mu
    LEFT JOIN updated_user uu ON uu.mssv = mu.mssv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.login_user(VARCHAR, TEXT) TO anon, authenticated;