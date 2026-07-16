-- ==========================================
-- FILE 1: CẤU TRÚC CƠ SỞ DỮ LIỆU (SCHEMA & INDEXES)
-- ==========================================

-- 1. KHỞI TẠO ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'student');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE quiz_type_enum AS ENUM ('normal', 'weekly');
CREATE TYPE quiz_status AS ENUM ('draft', 'active', 'inactive');
CREATE TYPE question_type_enum AS ENUM ('mcq', 'fill_text');
CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'timeout');

-- 2. KHỞI TẠO BẢNG (TABLES)
-- 2.1. Bảng users
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mssv VARCHAR(20) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role user_role NOT NULL,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2.2. Bảng categories
CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);
INSERT INTO categories (name) VALUES ('C/C++'), ('Mobile (Java)'), ('Web (HTML/CSS/JavaScript)');

-- 2.3. Bảng quizzes
CREATE TABLE quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty difficulty_level NOT NULL,
    quiz_type quiz_type_enum NOT NULL,
    duration INTEGER NOT NULL,
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

-- 2.4. Bảng questions
CREATE TABLE questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    code_snippet TEXT, 
    explanation TEXT, 
    question_type question_type_enum NOT NULL,
    display_order INTEGER NOT NULL,
    weight INTEGER DEFAULT 1
);

-- 2.5. Bảng answers
CREATE TABLE answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL, 
    is_correct BOOLEAN DEFAULT FALSE,
    display_order INTEGER NOT NULL
);

-- 2.6. Bảng attempts
CREATE TABLE attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(mssv) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_questions INTEGER,
    completion_time INTEGER, 
    started_at TIMESTAMP DEFAULT NOW(),
    submitted_at TIMESTAMP,
    status attempt_status DEFAULT 'in_progress',
    is_weekly_attempt BOOLEAN DEFAULT FALSE,
    is_delete BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- 2.7. Bảng attempt_answers
CREATE TABLE attempt_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer_id UUID REFERENCES answers(id) ON DELETE SET NULL,
    fill_text_answer TEXT,
    is_correct BOOLEAN
);

-- 2.8. Bảng Snapshot Leaderboard
CREATE TABLE weekly_leaderboard_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    user_id VARCHAR(20) REFERENCES users(mssv) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    completion_time INTEGER NOT NULL,
    captured_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- 3. INDEXES & CONSTRAINTS (RÀNG BUỘC & CHỈ MỤC BẮT BUỘC)
-- ==========================================
CREATE UNIQUE INDEX one_active_attempt_per_user ON attempts (user_id, quiz_id) WHERE status = 'in_progress';
CREATE UNIQUE INDEX unique_active_weekly_attempts ON attempts (user_id, quiz_id) WHERE is_delete = false AND is_weekly_attempt = true;
CREATE INDEX idx_attempts_leaderboard ON attempts (quiz_id, status, score DESC, completion_time ASC);
CREATE INDEX idx_snapshot_quiz ON weekly_leaderboard_snapshots(quiz_id);

-- ==========================================
-- 4. PERFORMANCE TUNING INDEXES (TỐI ƯU TRUY VẤN)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_quizzes_category_status ON quizzes (category_id, status);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes (created_by);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_order ON questions (quiz_id, display_order);
CREATE INDEX IF NOT EXISTS idx_answers_question_order ON answers (question_id, display_order);
CREATE INDEX IF NOT EXISTS idx_attempts_user_quiz ON attempts (user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers (attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question ON attempt_answers (question_id);
CREATE INDEX IF NOT EXISTS idx_snapshot_user ON weekly_leaderboard_snapshots (user_id);
