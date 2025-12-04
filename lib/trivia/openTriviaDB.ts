/**
 * Open Trivia DB API Integration
 * https://opentdb.com/api_config.php
 */

export interface OpenTriviaQuestion {
  category: string;
  type: 'multiple' | 'boolean';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface OpenTriviaResponse {
  response_code: number;
  results: OpenTriviaQuestion[];
}

/**
 * Fetch questions from Open Trivia DB
 */
export async function fetchTriviaQuestions(
  amount: number = 10,
  category?: number,
  difficulty?: 'easy' | 'medium' | 'hard',
  type: 'multiple' | 'boolean' = 'multiple'
): Promise<OpenTriviaQuestion[]> {
  try {
    let url = `https://opentdb.com/api.php?amount=${amount}&type=${type}`;
    
    if (category) {
      url += `&category=${category}`;
    }
    
    if (difficulty) {
      url += `&difficulty=${difficulty}`;
    }
    
    // Encode URL to handle special characters
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Open Trivia DB API error: ${response.status}`);
    }
    
    const data: OpenTriviaResponse = await response.json();
    
    if (data.response_code !== 0) {
      throw new Error(`Open Trivia DB API error: Response code ${data.response_code}`);
    }
    
    // Decode HTML entities in questions and answers
    return data.results.map(q => ({
      ...q,
      question: decodeHTMLEntities(q.question),
      correct_answer: decodeHTMLEntities(q.correct_answer),
      incorrect_answers: q.incorrect_answers.map(a => decodeHTMLEntities(a)),
    }));
  } catch (error) {
    console.error('Error fetching trivia questions:', error);
    throw error;
  }
}

/**
 * Fetch questions divided into thirds: 1/3 easy, 1/3 medium, 1/3 hard
 */
export async function fetchTriviaQuestionsMixed(
  totalAmount: number = 10,
  category?: number,
  type: 'multiple' | 'boolean' = 'multiple'
): Promise<OpenTriviaQuestion[]> {
  try {
    // Calculate distribution: 1/3 easy, 1/3 medium, 1/3 hard
    const easyCount = Math.ceil(totalAmount / 3);
    const mediumCount = Math.ceil(totalAmount / 3);
    const hardCount = totalAmount - easyCount - mediumCount;
    
    // Fetch questions for each difficulty
    const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
      fetchTriviaQuestions(easyCount, category, 'easy', type),
      fetchTriviaQuestions(mediumCount, category, 'medium', type),
      fetchTriviaQuestions(hardCount, category, 'hard', type),
    ]);
    
    // Combine and shuffle to mix difficulties
    const allQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];
    return shuffleArray(allQuestions);
  } catch (error) {
    console.error('Error fetching mixed trivia questions:', error);
    throw error;
  }
}

/**
 * Decode HTML entities
 */
function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Format question for display (combine correct and incorrect answers, shuffle)
 */
export function formatQuestion(question: OpenTriviaQuestion): {
  question: string;
  options: string[];
  correctAnswer: string;
} {
  const options = shuffleArray([
    question.correct_answer,
    ...question.incorrect_answers,
  ]);
  
  return {
    question: question.question,
    options: options.slice(0, 3), // Limit to 3 options
    correctAnswer: question.correct_answer,
  };
}

/**
 * Get available categories from Open Trivia DB
 */
export async function getTriviaCategories(): Promise<Array<{ id: number; name: string }>> {
  try {
    const response = await fetch('https://opentdb.com/api_category.php');
    const data = await response.json();
    return data.trivia_categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

