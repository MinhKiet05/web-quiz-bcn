import { db } from '../config/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Lấy dữ liệu quiz đã làm của user theo MSSV
 * Collection: users_quiz
 * Document ID: MSSV (vd: 23696901, 22666271)
 * Structure: {
 *   week1: { Quiz1: "A", Quiz2: "B", Quiz3: "B", Quiz4: "B", Quiz5: "D" },
 *   week2: { Quiz1: "C", Quiz2: "A", ... }
 * }
 * @param {string} username - MSSV của student (document ID trong collection users_quiz)
 * @returns {Promise<Object>} Dữ liệu quiz đã làm theo tuần
 */
export const getUserQuizData = async (username) => {
  try {
    const userRef = doc(db, 'users_quiz', username);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.log('Không tìm thấy dữ liệu quiz cho MSSV:', username);
      return {};
    }
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu quiz đã làm:', error);
    throw error;
  }
};

/**
 * Lấy dữ liệu quiz đã làm của user theo tuần cụ thể
 * @param {string} username - MSSV của student (sử dụng username từ auth)
 * @param {string} weekKey - Key của tuần (vd: 'week1', 'week2')
 * @returns {Promise<Object>} Dữ liệu quiz đã làm trong tuần
 */
export const getUserQuizByWeek = async (username, weekKey) => {
  try {
    const userData = await getUserQuizData(username);
    return userData[weekKey] || {};
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu quiz tuần ${weekKey}:`, error);
    throw error;
  }
};

/**
 * Kiểm tra xem user đã làm quiz nào chưa
 * @param {string} username - MSSV của student (sử dụng username từ auth)
 * @param {string} weekKey - Key của tuần
 * @param {string} quizKey - Key của quiz (vd: 'Quiz1', 'Quiz2')
 * @returns {Promise<string|null>} Đáp án đã chọn hoặc null nếu chưa làm
 */
export const getUserQuizAnswer = async (username, weekKey, quizKey) => {
  try {
    const weekData = await getUserQuizByWeek(username, weekKey);
    return weekData[quizKey] || null;
  } catch (error) {
    console.error(`Lỗi khi lấy đáp án quiz ${quizKey}:`, error);
    return null;
  }
};

/**
 * Lấy tất cả tuần có dữ liệu quiz
 * @param {string} username - MSSV của student (sử dụng username từ auth)
 * @returns {Promise<Array>} Danh sách tuần có dữ liệu
 */
export const getAvailableWeeks = async (username) => {
  try {
    const userData = await getUserQuizData(username);
    return Object.keys(userData).filter(key => key.startsWith('week')).sort();
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tuần:', error);
    return [];
  }
};

/**
 * Tính điểm số cho một tuần
 * @param {Object} userWeekData - Dữ liệu quiz đã làm trong tuần
 * @param {Object} correctAnswers - Đáp án đúng
 * @returns {Object} Thông tin điểm số { correct, total, percentage }
 */
export const calculateWeekScore = (userWeekData, correctAnswers) => {
  if (!userWeekData || !correctAnswers) return { correct: 0, total: 0, percentage: 0 };
  
  let correct = 0;
  let total = 0;
  
  Object.keys(correctAnswers).forEach(quizKey => {
    if (userWeekData[quizKey] !== undefined) {
      total++;
      if (userWeekData[quizKey] === correctAnswers[quizKey]) {
        correct++;
      }
    }
  });
  
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  return { correct, total, percentage };
};