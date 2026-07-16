-- ==========================================
-- FILE 3: TRIGGERS, FUNCTIONS & RPC (LOGIC SERVER)
-- ==========================================

-- 1. TRIGGER: ĐỒNG BỘ AUTH.USERS SANG PUBLIC.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, mssv, full_name, email, role, is_active)
  VALUES (
    new.id,                                                 
    COALESCE(new.raw_user_meta_data->>'mssv', 'SV' || floor(random() * 9000000 + 1000000)::text), 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Sinh viên mới'), 
    new.email,                                              
    (COALESCE(new.raw_user_meta_data->>'role', 'student'))::user_role,
    true                                                    
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. RPC: NỘP BÀI THI (HỖ TRỢ MCQ & FILL_TEXT)
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
    p_user_id VARCHAR,
    p_quiz_id UUID,
    p_answers JSONB,
    p_completion_time INT
)
RETURNS TABLE (attempt_id UUID, final_score INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt_id UUID;
    v_total_score INT := 0;
    v_total_correct INT := 0;
    v_total_questions INT;
    v_is_weekly BOOLEAN;
    v_item JSONB;
    v_is_correct BOOLEAN;
    v_weight INT;
    v_correct_text TEXT;
    v_fill_answer TEXT;
BEGIN
    SELECT quiz_type='weekly' INTO v_is_weekly FROM quizzes WHERE id=p_quiz_id;
    SELECT COUNT(*) INTO v_total_questions FROM questions WHERE quiz_id=p_quiz_id;

    INSERT INTO attempts(
        user_id, quiz_id, status, is_weekly_attempt,
        completion_time, started_at, submitted_at
    )
    VALUES(
        p_user_id, p_quiz_id, 'submitted', v_is_weekly,
        p_completion_time, NOW()-(p_completion_time||' seconds')::interval, NOW()
    )
    RETURNING id INTO v_attempt_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_answers) LOOP
        IF (v_item->>'selected_answer_id') IS NOT NULL THEN
            SELECT is_correct INTO v_is_correct FROM answers
            WHERE id=(v_item->>'selected_answer_id')::uuid AND question_id=(v_item->>'question_id')::uuid;
        ELSE
            v_fill_answer:=lower(trim(coalesce(v_item->>'fill_text_answer','')));
            SELECT lower(trim(answer_text)) INTO v_correct_text FROM answers
            WHERE question_id=(v_item->>'question_id')::uuid AND is_correct=true LIMIT 1;
            v_is_correct:=v_fill_answer=v_correct_text;
        END IF;

        v_is_correct:=coalesce(v_is_correct,false);

        SELECT weight INTO v_weight FROM questions WHERE id=(v_item->>'question_id')::uuid;

        IF v_is_correct THEN
            v_total_correct:=v_total_correct+1;
            v_total_score:=v_total_score+coalesce(v_weight,10);
        END IF;

        INSERT INTO attempt_answers(
            attempt_id, question_id, selected_answer_id, fill_text_answer, is_correct
        )
        VALUES(
            v_attempt_id, 
            (v_item->>'question_id')::uuid,
            CASE WHEN (v_item->>'selected_answer_id') IS NOT NULL THEN (v_item->>'selected_answer_id')::uuid ELSE NULL END,
            v_item->>'fill_text_answer',
            v_is_correct
        );
    END LOOP;

    UPDATE attempts
    SET score=v_total_score, total_correct=v_total_correct, total_questions=v_total_questions
    WHERE id=v_attempt_id;

    RETURN QUERY SELECT v_attempt_id, v_total_score;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(VARCHAR, UUID, JSONB, INT) TO anon, authenticated;

-- 3. RPC: ADMIN CẬP NHẬT THÔNG TIN USERS
CREATE OR REPLACE FUNCTION admin_update_user_info(
  p_mssv TEXT, p_full_name TEXT, p_role TEXT, p_is_active BOOLEAN
)
RETURNS void
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_auth_id uuid;
  v_is_admin boolean := false;
  v_caller_role text;
BEGIN
  v_caller_role := current_setting('request.jwt.claims', true)::jsonb ->> 'role';
  
  IF v_caller_role = 'service_role' THEN
    v_is_admin := true;
  ELSE
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'::user_role) INTO v_is_admin;
  END IF;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Từ chối truy cập: Bạn không phải Admin!';
  END IF;

  SELECT id INTO v_auth_id FROM public.users WHERE mssv = p_mssv;
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy người dùng với MSSV này!';
  END IS NULL;

  UPDATE public.users SET full_name = p_full_name, role = p_role::user_role, is_active = p_is_active WHERE mssv = p_mssv;

  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
        jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{full_name}', to_jsonb(p_full_name)),
        '{role}', to_jsonb(p_role)
      )
  WHERE id = v_auth_id;
END;
$$;

-- 4. RPC DỰ PHÒNG: LOGIN BẰNG CUSTOM AUTH (Trường hợp vẫn dùng song song với Supabase Auth)
CREATE OR REPLACE FUNCTION public.login_user(p_mssv VARCHAR, p_password TEXT)
RETURNS TABLE (mssv VARCHAR, full_name VARCHAR, email VARCHAR, role user_role, last_login TIMESTAMP) AS $$
BEGIN
    RETURN QUERY
    WITH matched_user AS (
        SELECT u.mssv, u.full_name, u.email, u.role, u.last_login
        FROM users u WHERE u.mssv = p_mssv AND u.is_active = TRUE AND u.password_hash = p_password LIMIT 1
    ), updated_user AS (
        UPDATE users u SET last_login = NOW()::timestamp, updated_at = NOW()::timestamp
        WHERE u.mssv IN (SELECT mu.mssv FROM matched_user mu)
        RETURNING u.mssv, u.full_name, u.email, u.role, u.last_login
    )
    SELECT mu.mssv, mu.full_name, mu.email, mu.role, COALESCE(uu.last_login, NOW()::timestamp)
    FROM matched_user mu LEFT JOIN updated_user uu ON uu.mssv = mu.mssv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.login_user(VARCHAR, TEXT) TO anon, authenticated;
