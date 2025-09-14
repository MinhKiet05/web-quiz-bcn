// Test utilities for QuizHistory development
// This is for testing purposes only

/**
 * Sample quiz data for testing
 */
export const sampleQuizData = {
  week1: {
    Quiz1: 'A',
    Quiz2: 'B', 
    Quiz3: 'C',
    Quiz4: 'D',
    Quiz5: 'A'
  },
  week2: {
    Quiz1: 'B',
    Quiz2: 'A',
    Quiz3: 'D'
  }
};

/**
 * Sample week quiz structure for testing
 */
export const sampleWeekQuizzes = {
  week1: [
    {
      quizNumber: 1,
      question: 'Câu hỏi mẫu số 1: Hãy chọn đáp án đúng về ngôn ngữ C?',
      optionA: 'C là ngôn ngữ bậc cao',
      optionB: 'C là ngôn ngữ bậc thấp', 
      optionC: 'C là ngôn ngữ script',
      optionD: 'C là ngôn ngữ markup',
      correctAnswer: 'A',
      explanation: 'C là ngôn ngữ lập trình bậc cao, được phát triển bởi Dennis Ritchie.',
      imageUrl: '',
      startTime: new Date('2024-01-01T08:00:00'),
      endTime: new Date('2024-01-07T23:59:59')
    },
    {
      quizNumber: 2,
      question: 'Câu hỏi mẫu số 2: Kiểu dữ liệu nào sau đây là kiểu số nguyên trong C?',
      optionA: 'float',
      optionB: 'int',
      optionC: 'char',
      optionD: 'double',
      correctAnswer: 'B',
      explanation: 'int là kiểu dữ liệu số nguyên cơ bản trong C.',
      imageUrl: '',
      startTime: new Date('2024-01-01T08:00:00'),
      endTime: new Date('2024-01-07T23:59:59')
    },
    {
      quizNumber: 3,
      question: 'Câu hỏi mẫu số 3: Cú pháp nào đúng để khai báo mảng trong C?',
      optionA: 'array[10] int;',
      optionB: 'int array(10);',
      optionC: 'int array[10];',
      optionD: 'int[10] array;',
      correctAnswer: 'C',
      explanation: 'Cú pháp đúng để khai báo mảng là: kiểu_dữ_liệu tên_mảng[kích_thước];',
      imageUrl: '',
      startTime: new Date('2024-01-01T08:00:00'),
      endTime: new Date('2024-01-07T23:59:59')
    },
    {
      quizNumber: 4,
      question: 'Câu hỏi mẫu số 4: Hàm nào được sử dụng để in ra màn hình trong C?',
      optionA: 'print()',
      optionB: 'cout',
      optionC: 'console.log()',
      optionD: 'printf()',
      correctAnswer: 'D',
      explanation: 'printf() là hàm chuẩn để in ra màn hình trong ngôn ngữ C.',
      imageUrl: '',
      startTime: new Date('2024-01-01T08:00:00'),
      endTime: new Date('2024-01-07T23:59:59')
    },
    {
      quizNumber: 5,
      question: 'Câu hỏi mẫu số 5: Con trỏ trong C được khai báo như thế nào?',
      optionA: 'int &ptr;',
      optionB: 'int *ptr;',
      optionC: 'ptr int*;',
      optionD: 'pointer int ptr;',
      correctAnswer: 'B',
      explanation: 'Con trỏ được khai báo bằng cách sử dụng dấu * trước tên biến: int *ptr;',
      imageUrl: '',
      startTime: new Date('2024-01-01T08:00:00'),
      endTime: new Date('2024-01-07T23:59:59')
    }
  ]
};

/**
 * Mock function to simulate getUserQuizByWeek for testing
 */
export const mockGetUserQuizByWeek = async (mssv, weekKey) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(sampleQuizData[weekKey] || {});
    }, 500);
  });
};

/**
 * Mock function to simulate getQuizzesByWeek for testing
 */
export const mockGetQuizzesByWeek = async (weekKey) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(sampleWeekQuizzes[weekKey] || []);
    }, 300);
  });
};

/**
 * Mock function to simulate getAvailableWeeks for testing
 */
export const mockGetAvailableWeeks = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(['week1', 'week2']);
    }, 200);
  });
};