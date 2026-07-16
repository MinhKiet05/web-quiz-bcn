-- ==========================================
-- FILE 2: ROW LEVEL SECURITY & POLICIES (BẢO MẬT)
-- ==========================================

-- BẬT RLS CHO TẤT CẢ CÁC BẢNG
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- USERS POLICIES
-- ==========================================
CREATE POLICY "Allow public to view user profiles" ON users FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admin_Select_All_Users" ON users FOR SELECT TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "Allow admin to insert users" ON users AS PERMISSIVE FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'::user_role));

-- ==========================================
-- CATEGORIES & SNAPSHOTS POLICIES (Mở public)
-- ==========================================
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read leaderboard snapshots" ON weekly_leaderboard_snapshots FOR SELECT USING (true);

-- ==========================================
-- QUIZZES, QUESTIONS, ANSWERS POLICIES
-- ==========================================
CREATE POLICY "Allow public read active quizzes" ON quizzes FOR SELECT USING (status = 'active');
CREATE POLICY "Authenticated users read questions" ON questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users read answers" ON answers FOR SELECT TO authenticated USING (true);

-- God Mode Admin/Editor
CREATE POLICY "Admin_Editor_Quizzes" ON quizzes AS PERMISSIVE FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'editor') OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role::text IN ('admin', 'editor'))) WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'editor') OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role::text IN ('admin', 'editor')));
CREATE POLICY "Admin_Editor_Questions" ON questions AS PERMISSIVE FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'editor') OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role::text IN ('admin', 'editor'))) WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'editor') OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role::text IN ('admin', 'editor')));
CREATE POLICY "Admin_Editor_Answers" ON answers AS PERMISSIVE FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'editor') OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role::text IN ('admin', 'editor'))) WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'editor') OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role::text IN ('admin', 'editor')));

-- ==========================================
-- ATTEMPTS & ATTEMPT_ANSWERS POLICIES
-- ==========================================
CREATE POLICY "Users read own attempts" ON attempts FOR SELECT TO authenticated USING (user_id = (auth.jwt() -> 'user_metadata' ->> 'mssv'));
CREATE POLICY "Allow public to read submitted attempts for leaderboard" ON attempts FOR SELECT USING (status = 'submitted');
CREATE POLICY "Users can read their own in_progress attempts" ON attempts FOR SELECT USING (user_id = (auth.jwt() -> 'user_metadata' ->> 'mssv') OR status = 'submitted');
CREATE POLICY "Users read own attempt_answers" ON attempt_answers FOR SELECT TO authenticated USING (attempt_id IN (SELECT id FROM attempts WHERE user_id = (auth.jwt() -> 'user_metadata' ->> 'mssv')));
CREATE POLICY "Allow admin to update attempts" ON attempts AS PERMISSIVE FOR UPDATE TO public USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
