import { collection, doc, getDoc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export const quizService = {
  // Lấy quiz từ week document (week1, week2, etc.)
  async getQuizzesFromWeekDocument(weekDocumentId) {
    try {
      const weekDocRef = doc(db, 'Quiz', weekDocumentId);
      const weekDoc = await getDoc(weekDocRef);
      
      if (!weekDoc.exists()) {
        return [];
      }
      
      const weekData = weekDoc.data();
      const quizzes = [];
      
      // Tìm tất cả Quiz1, Quiz2, Quiz3, Quiz4, Quiz5
      for (let i = 1; i <= 5; i++) {
        const quizKey = `Quiz${i}`;
        if (weekData[quizKey]) {
          const quizData = weekData[quizKey];
          quizzes.push({
            id: `${weekDocumentId}_${quizKey}`,
            title: quizKey,
            week: parseInt(weekDocumentId.replace('week', '')),
            ...quizData,
            // Thêm startTime và endTime từ level cao hơn nếu có
            startTime: quizData.startTime || weekData.startTime,
            endTime: quizData.endTime || weekData.endTime
          });
        }
      }
      
      return quizzes;
    } catch (error) {
      throw error;
    }
  },

  // Lấy tất cả quiz của một tuần
  async getQuizzesByWeek(week) {
    try {
      const quizzesRef = collection(db, 'Quiz');
      const q = query(quizzesRef, where('week', '==', week));
      const snapshot = await getDocs(q);
      
      const quizzes = [];
      snapshot.forEach((doc) => {
        const quizData = { id: doc.id, ...doc.data() };
        quizzes.push(quizData);
      });
      
      // Sort by quiz number if available in title
      quizzes.sort((a, b) => {
        const aNum = parseInt(a.title?.replace('Quiz', '') || '0');
        const bNum = parseInt(b.title?.replace('Quiz', '') || '0');
        return aNum - bNum;
      });
      
      return quizzes;
    } catch (error) {
      throw error;
    }
  },

  // Lấy đáp án của user cho một tuần với cấu trúc mới: users_quiz/{weekX}/{userId}
  async getUserAnswersByWeek(userId, week) {
    try {
      const weekKey = `week${week}`;
      const weekDocRef = doc(db, 'users_quiz', weekKey);
      const weekDoc = await getDoc(weekDocRef);
      
      if (weekDoc.exists()) {
        const weekData = weekDoc.data();
        return weekData[userId] || {};
      }
      
      return {};
    } catch (error) {
      throw error;
    }
  },

  // Lưu đáp án của user với cấu trúc mới: users_quiz/{weekX}/{userId}
  async saveUserAnswer(userId, week, quizNumber, answer) {
    try {
      const weekKey = `week${week}`;
      const quizKey = `Quiz${quizNumber}`;
      
      // Reference to the week document in users_quiz collection
      const weekDocRef = doc(db, 'users_quiz', weekKey);
      
      // Get current week data
      const weekDoc = await getDoc(weekDocRef);
      const weekData = weekDoc.exists() ? weekDoc.data() : {};
      
      // Get user's current answers for this week
      const userCurrentAnswers = weekData[userId] || {};
      
      // Create timestamp for when the answer is submitted
      const now = new Date();
      
      // Update the specific quiz answer with timestamp
      const updatedUserAnswers = {
        ...userCurrentAnswers,
        [quizKey]: answer,
        thoiGian: now // Lưu timestamp khi nộp/thay đổi đáp án
      };
      
      // Update the week document with user's new answers
      await setDoc(weekDocRef, {
        ...weekData,
        [userId]: updatedUserAnswers
      }, { merge: true });
      
      return updatedUserAnswers;
    } catch (error) {
      throw error;
    }
  },

  // Lưu nhiều đáp án cùng lúc với cấu trúc mới: users_quiz/{weekX}/{userId}
  async saveUserAnswers(userId, week, answers) {
    try {
      const weekKey = `week${week}`;
      const weekDocRef = doc(db, 'users_quiz', weekKey);
      
      // Get current week data
      const weekDoc = await getDoc(weekDocRef);
      const weekData = weekDoc.exists() ? weekDoc.data() : {};
      
      // Get user's current answers for this week
      const userCurrentAnswers = weekData[userId] || {};
      
      // Update with new answers
      const updatedUserAnswers = {
        ...userCurrentAnswers,
        ...answers
      };
      
      // Update the week document with user's updated answers
      await setDoc(weekDocRef, {
        ...weekData,
        [userId]: updatedUserAnswers
      }, { merge: true });
      
      return updatedUserAnswers;
    } catch (error) {
      throw error;
    }
  },

  // Lấy tất cả đáp án của user
  async getAllUserAnswers(userId) {
    try {
      const userDocRef = doc(db, 'users_quiz', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      
      return {};
    } catch (error) {
      throw error;
    }
  },

  // Tính toán tuần hiện tại
  getCurrentWeek(startDate = '2025-09-08') {
    const start = new Date(startDate);
    const today = new Date();
    
    // Nếu chưa tới ngày bắt đầu, return tuần 1
    if (today < start) {
      return 1;
    }
    
    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1; // +1 vì bắt đầu từ tuần 1
    
    return weekNumber;
  },

  // Kiểm tra xem quiz có được mở để làm không dựa trên thời gian
  isQuizAvailableByTime(quizData) {
    const now = new Date();
    
    // Nếu không có thời gian được set, mặc định là available
    if (!quizData.startTime || !quizData.endTime) {
      return true;
    }
    
    // Convert Firebase Timestamp to Date nếu cần
    const startTime = quizData.startTime.toDate ? quizData.startTime.toDate() : new Date(quizData.startTime);
    const endTime = quizData.endTime.toDate ? quizData.endTime.toDate() : new Date(quizData.endTime);
    
    return now >= startTime && now <= endTime;
  },

  // Lấy trạng thái thời gian của quiz
  getQuizTimeStatus(quizData) {
    const now = new Date();
    
    if (!quizData.startTime || !quizData.endTime) {
      return 'available'; // Mặc định là có thể làm
    }
    
    const startTime = quizData.startTime.toDate ? quizData.startTime.toDate() : new Date(quizData.startTime);
    const endTime = quizData.endTime.toDate ? quizData.endTime.toDate() : new Date(quizData.endTime);
    
    if (now < startTime) {
      return 'not_started'; // Chưa bắt đầu
    } else if (now > endTime) {
      return 'expired'; // Đã hết hạn
    } else {
      return 'available'; // Đang mở
    }
  },

  // Format thời gian hiển thị
  formatDateTime(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  },

  // Lấy quiz có sẵn trong tuần (chỉ những quiz đang trong thời gian cho phép)
  async getAvailableQuizzesByWeek(week) {
    try {
      const allQuizzes = await this.getQuizzesByWeek(week);
      
      // Lọc chỉ những quiz đang available
      const availableQuizzes = allQuizzes.filter(quiz => this.isQuizAvailableByTime(quiz));
      
      return availableQuizzes;
    } catch (error) {
      throw error;
    }
  },

  // Kiểm tra xem quiz có được mở để làm không (kết hợp thời gian và tuần)
  isQuizAvailable(quizData, currentWeek) {
    // Kiểm tra thời gian trước
    const timeStatus = this.getQuizTimeStatus(quizData);
    if (timeStatus !== 'available') {
      return false;
    }
    
    // Quiz chỉ có thể làm trong tuần của nó hoặc các tuần sau
    return currentWeek >= (quizData.week || 1);
  },

  // Tính điểm cho một quiz
  calculateQuizScore(quizNumber, isCorrect) {
    if (!isCorrect) return 0;
    
    // Quiz 1 = 1 điểm, Quiz 2 = 2 điểm, ..., Quiz 5 = 5 điểm
    return parseInt(quizNumber) || 1;
  },

  // Tính tổng điểm tuần
  calculateWeekScore(weekAnswers, correctAnswers) {
    let totalScore = 0;
    
    for (let i = 1; i <= 5; i++) {
      const quizKey = `Quiz${i}`;
      const userAnswer = weekAnswers[quizKey];
      const correctAnswer = correctAnswers[quizKey];
      
      if (userAnswer && userAnswer === correctAnswer) {
        totalScore += this.calculateQuizScore(i, true);
      }
    }
    
    return totalScore;
  }
};

export default quizService;