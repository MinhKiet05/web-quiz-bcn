--Câu lệnh SELECT truy vấn Real-time (Ví dụ lấy Top 10 của một Quiz cụ thể):
SELECT 
    RANK() OVER (ORDER BY a.score DESC, a.completion_time ASC) as rank,
    u.full_name,
    u.mssv,
    a.score,
    a.completion_time,
    a.submitted_at
FROM attempts a
JOIN users u ON a.user_id = u.mssv
WHERE a.quiz_id = '11111111-1111-1111-1111-111111111111' -- Thay bằng ID Quiz tuần này
  AND a.status = 'submitted'
ORDER BY a.score DESC, a.completion_time ASC
LIMIT 10;



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


--Lệnh SQL để "Chốt sổ" ghi dữ liệu vào Snapshot
INSERT INTO weekly_leaderboard_snapshots (quiz_id, rank, user_id, full_name, score, completion_time)
SELECT 
    a.quiz_id,
    (RANK() OVER (ORDER BY a.score DESC, a.completion_time ASC))::INTEGER as rank,
    a.user_id,
    u.full_name,
    a.score,
    a.completion_time
FROM attempts a
JOIN users u ON a.user_id = u.mssv
WHERE a.quiz_id = '11111111-1111-1111-1111-111111111111' -- ID của Quiz tuần vừa kết thúc
  AND a.status = 'submitted'
ORDER BY a.score DESC, a.completion_time ASC
LIMIT 50; -- Chỉ lưu lại Top 50 người xuất sắc nhất



--Câu lệnh SELECT khi người dùng xem lại tuần cũ
SELECT rank, full_name, user_id as mssv, score, completion_time
FROM weekly_leaderboard_snapshots
WHERE quiz_id = '11111111-1111-1111-1111-111111111111' -- ID của tuần cũ cần xem
ORDER BY rank ASC;