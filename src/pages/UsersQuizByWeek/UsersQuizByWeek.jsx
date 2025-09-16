import React, { useEffect, useState, useMemo } from 'react';
import { getAllAvailableWeeks, getWeekData } from '../../services/userQuizService.js';
import './UsersQuizByWeek.css';

const UsersQuizByWeek = () => {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [weekData, setWeekData] = useState({});
  const [loadingWeeks, setLoadingWeeks] = useState(true);
  const [loadingWeekData, setLoadingWeekData] = useState(false);
  const [searchMssv, setSearchMssv] = useState('');

  useEffect(() => {
    const loadWeeks = async () => {
      setLoadingWeeks(true);
      const allWeeks = await getAllAvailableWeeks();
      setWeeks(allWeeks);
      setLoadingWeeks(false);
      if (allWeeks.length > 0) setSelectedWeek(allWeeks[0]);
    };

    loadWeeks();
  }, []);

  useEffect(() => {
    if (!selectedWeek) return;

    const loadWeek = async () => {
      setLoadingWeekData(true);
      const data = await getWeekData(selectedWeek);
      setWeekData(data || {});
      setLoadingWeekData(false);
    };

    loadWeek();
  }, [selectedWeek]);

  const exportToExcel = () => {
    if (rows.length === 0 || !selectedWeek) return;

    // Create CSV content
    const headers = ['MSSV', 'Quiz1', 'Quiz2', 'Quiz3', 'Quiz4', 'Quiz5', 'Thời gian'];
    const csvRows = [headers.join(',')];
    
    rows.forEach(r => {
      const a = r.answers || {};
      const time = a.thoiGian || a.time || a.timestamp || '';
      let timeStr = '';
      if (time) {
        try {
          timeStr = time.toDate ? time.toDate().toLocaleString() : new Date(time).toLocaleString();
        } catch {
          timeStr = String(time);
        }
      }
      
      const row = [
        r.mssv,
        a.Quiz1 || '',
        a.Quiz2 || '',
        a.Quiz3 || '',
        a.Quiz4 || '',
        a.Quiz5 || '',
        timeStr
      ];
      csvRows.push(row.join(','));
    });

    // Download CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users-quiz-${selectedWeek}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rows = useMemo(() => {
    const list = Object.entries(weekData || {}).map(([mssv, answers]) => ({ mssv, answers }));
    if (!searchMssv.trim()) return list;
    return list.filter(r => r.mssv.includes(searchMssv.trim()));
  }, [weekData, searchMssv]);

    return (
    <div className="users-quiz-by-week-container">
    <div className="users-quiz-by-week">
      <h2>Danh sách người làm quiz theo tuần</h2>

      <div className="users-quiz-by-week-controls">
        <div className="users-quiz-by-week-control">
          <label>Chọn tuần:</label>
          <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
            {loadingWeeks ? <option>Đang tải tuần...</option> : (
              weeks.length === 0 ? <option>Không có tuần nào</option> : (
                weeks.map(w => <option key={w} value={w}>{w}</option>)
              )
            )}
          </select>
        </div>

        <div className="users-quiz-by-week-control users-quiz-by-week-search-control">
          <label>Tìm theo MSSV:</label>
          <input
            placeholder="Nhập MSSV..."
            value={searchMssv}
            onChange={(e) => setSearchMssv(e.target.value)}
          />
        </div>

        <button
          className="users-quiz-by-week-export-btn"
          onClick={exportToExcel}
          disabled={rows.length === 0 || !selectedWeek}
        >
          Xuất Excel
        </button>
      </div>

      <div className="users-quiz-by-week-week-data">
        {loadingWeekData ? (
          <div className="users-quiz-by-week-loading">Đang tải dữ liệu tuần...</div>
        ) : (
          <table className="users-quiz-by-week-week-table">
            <thead>
              <tr>
                <th>MSSV</th>
                <th>Quiz1</th>
                <th>Quiz2</th>
                <th>Quiz3</th>
                <th>Quiz4</th>
                <th>Quiz5</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Không tìm thấy dữ liệu</td></tr>
              ) : rows.map(r => {
                const a = r.answers || {};
                // Answers may store timestamps under a._time or a.thoiGian - try common keys
                const time = a.thoiGian || a.time || a.timestamp || '';
                let timeStr = '';
                if (time) {
                  try {
                    // If Firestore Timestamp object, it may have toDate()
                    timeStr = time.toDate ? time.toDate().toLocaleString() : new Date(time).toLocaleString();
                  } catch {
                    timeStr = String(time);
                  }
                }

                return (
                  <tr key={r.mssv}>
                    <td>{r.mssv}</td>
                    <td>{a.Quiz1 || '-'}</td>
                    <td>{a.Quiz2 || '-'}</td>
                    <td>{a.Quiz3 || '-'}</td>
                    <td>{a.Quiz4 || '-'}</td>
                    <td>{a.Quiz5 || '-'}</td>
                    <td>{timeStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
        </div>
        </div>  
  );
};

export default UsersQuizByWeek;
