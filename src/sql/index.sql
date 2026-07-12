-- Tạo Index tối ưu tốc độ truy vấn xếp hạng Real-time
CREATE INDEX idx_attempts_leaderboard 
ON attempts (quiz_id, status, score DESC, completion_time ASC);