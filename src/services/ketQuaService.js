import { doc, setDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'Ket Qua';

/**
 * Lưu kết quả vào Firestore
 * @param {Object} data - Dữ liệu kết quả
 * @param {string|null} documentId - ID document (nếu có thì update, nếu null thì add mới)
 * @returns {Promise<string>} - ID của document
 */
export const saveKetQua = async (data, documentId = null) => {
  try {
    if (documentId) {
      // Update existing document
      const docRef = doc(db, COLLECTION_NAME, documentId);
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log('Document updated with ID: ', documentId);
      return documentId;
    } else {
      // Add new document
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Document written with ID: ', docRef.id);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving document: ', error);
    throw error;
  }
};

/**
 * Lấy kết quả theo ID
 * @param {string} documentId - ID document
 * @returns {Promise<Object|null>} - Dữ liệu document hoặc null nếu không tồn tại
 */
export const getKetQua = async (documentId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting document: ', error);
    throw error;
  }
};

/**
 * Ví dụ sử dụng
 */
export const exampleUsage = async () => {
  try {
    // Dữ liệu mẫu
    const ketQuaData = {
      userId: 'user123',
      quizId: 'quiz456',
      score: 85,
      totalQuestions: 10,
      correctAnswers: 8,
      timeTaken: 300, // seconds
      answers: [
        { questionId: 'q1', userAnswer: 'A', isCorrect: true },
        { questionId: 'q2', userAnswer: 'B', isCorrect: false }
      ]
    };
    
    // Thêm mới
    const newId = await saveKetQua(ketQuaData);
    console.log('Added new result with ID:', newId);
    
    // Cập nhật
    const updatedData = {
      ...ketQuaData,
      score: 90,
      correctAnswers: 9
    };
    await saveKetQua(updatedData, newId);
    console.log('Updated result with ID:', newId);
    
    // Lấy dữ liệu
    const result = await getKetQua(newId);
    console.log('Retrieved result:', result);
    
  } catch (error) {
    console.error('Example usage error:', error);
  }
};
