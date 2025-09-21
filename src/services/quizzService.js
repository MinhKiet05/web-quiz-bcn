import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'Quiz';

/**
 * Lấy tất cả documents từ collection "Quiz"
 * @returns {Promise<Array>} - Mảng tất cả documents
 */
export const getAllQuizzes = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const quizzes = [];
    
    querySnapshot.forEach((doc) => {
      quizzes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return quizzes;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy một quiz theo ID
 * @param {string} quizId - ID của quiz
 * @returns {Promise<Object|null>} - Quiz data hoặc null
 */
export const getQuizById = async (quizId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, quizId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Parse quiz data để lấy danh sách câu hỏi
 * @param {Object} quizData - Raw quiz data từ Firestore
 * @returns {Array} - Mảng các câu hỏi đã format
 */
export const parseQuizQuestions = (quizData) => {
  const questions = [];
  
  // Trường hợp 1: Document chứa các quiz con (như week1 chứa Quiz1, Quiz2)
  Object.keys(quizData).forEach(key => {
    // Tìm các quiz con (Quiz1, Quiz2, etc.)
    if (key.toLowerCase().startsWith('quiz') && typeof quizData[key] === 'object') {
      const quiz = quizData[key];
      questions.push({
        id: key,
        questionNumber: key,
        correctAnswer: quiz.dapAnDung || quiz['Đáp án đúng'] || '',
        url: quiz.link || quiz['Đường dẫn'] || quiz.url || '',
        explanation: quiz.giaiThich || quiz.explanation || '',
        answers: quiz.soDapAn || [],
        answerCount: Array.isArray(quiz.soDapAn) ? quiz.soDapAn.length : (quiz.soDapAn || 0),
        isNestedQuiz: true,
        ...quiz
      });
    }
    // Trường hợp 2: Các câu hỏi riêng lẻ (cau1, cau2, etc.)
    else if (key.startsWith('cau') && typeof quizData[key] === 'object') {
      questions.push({
        id: key,
        questionNumber: key,
        correctAnswer: quizData[key].dapAnDung || quizData[key]['Đáp án đúng'] || '',
        url: quizData[key].link || quizData[key]['Đường dẫn'] || quizData[key].url || '',
        explanation: quizData[key].giaiThich || quizData[key].explanation || '',
        answers: quizData[key].soDapAn || [],
        ...quizData[key]
      });
    }
  });
  
  // Trường hợp 3: Nếu không có câu hỏi con, tạo một câu hỏi tổng quát từ thông tin chính
  if (questions.length === 0 && (quizData['Đáp án đúng'] || quizData.dapAnDung || quizData.soDapAn)) {
    questions.push({
      id: 'main',
      questionNumber: 'Quiz chính',
      correctAnswer: quizData.dapAnDung || quizData['Đáp án đúng'] || '',
      url: quizData.link || quizData['Đường dẫn'] || quizData.url || '',
      explanation: quizData.giaiThich || quizData.explanation || '',
      answers: quizData.soDapAn || [],
      answerCount: Array.isArray(quizData.soDapAn) ? quizData.soDapAn.length : (quizData.soDapAn || 0),
      isMainQuiz: true
    });
  }
  
  // Sort theo số thứ tự câu hỏi
  questions.sort((a, b) => {
    if (a.isMainQuiz) return -1; // Main quiz lên đầu
    if (b.isMainQuiz) return 1;
    
    // Sort quiz con theo số
    if (a.isNestedQuiz && b.isNestedQuiz) {
      const numA = parseInt(a.id.toLowerCase().replace('quiz', '')) || 0;
      const numB = parseInt(b.id.toLowerCase().replace('quiz', '')) || 0;
      return numA - numB;
    }
    
    // Sort câu hỏi thường
    const numA = parseInt(a.id.replace('cau', '')) || 0;
    const numB = parseInt(b.id.replace('cau', '')) || 0;
    return numA - numB;
  });
  
  return questions;
};
