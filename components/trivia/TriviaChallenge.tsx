/**
 * Trivia Challenge Component
 * 10 questions, 3 options each, 10 seconds per question
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTriviaQuestionsMixed, formatQuestion, shuffleArray } from '@/lib/trivia/openTriviaDB';
import { OpenTriviaQuestion } from '@/lib/trivia/openTriviaDB';
import { addTokens } from '@/lib/tokens/tokenSystem';
import { collection, addDoc, doc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { TriviaSession, TriviaChallenge } from '@/lib/firebase/types';
import { useToast } from '@/contexts/ToastContext';

interface TriviaChallengeProps {
  challenge: TriviaChallenge;
  onComplete: (tokensEarned: number) => void;
  onExit: () => void;
}

export default function TriviaChallengeComponent({ challenge, onComplete, onExit }: TriviaChallengeProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [questions, setQuestions] = useState<Array<{
    question: string;
    options: string[];
    correctAnswer: string;
  }>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(challenge.timePerQuestion);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(true);
  const [countdown, setCountdown] = useState<string>('');
  const [existingSession, setExistingSession] = useState<TriviaSession | null>(null);
  const [answers, setAnswers] = useState<Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    userAnswer?: string;
    isCorrect?: boolean;
    timeSpent: number;
    questionNumber: number;
    bonusMultiplier?: number;
  }>>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    loadQuestions();
    checkDailyLimit();
    
    // Update countdown every second
    countdownTimerRef.current = setInterval(() => {
      updateCountdown();
    }, 1000);
    
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Check if user can play today
  const checkDailyLimit = async () => {
    if (!user || !challenge.id) return;
    
    const challengeId = challenge.id; // Store in local variable for TypeScript
    
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Check for completed session today
      const sessionsQuery = query(
        collection(db, 'triviaSessions'),
        where('userId', '==', user.uid),
        where('challengeId', '==', challengeId),
        where('completed', '==', true)
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const todaySessions = sessionsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as TriviaSession))
        .filter(session => {
          const sessionDate = session.lastAttemptDate || 
            (session.completedAt instanceof Timestamp 
              ? session.completedAt.toDate().toISOString().split('T')[0]
              : new Date(session.completedAt || session.startedAt).toISOString().split('T')[0]);
          return sessionDate === today;
        });
      
      if (todaySessions.length > 0) {
        setCanPlay(false);
        updateCountdown();
        return;
      }
      
      // Check for incomplete session (resume)
      const incompleteQuery = query(
        collection(db, 'triviaSessions'),
        where('userId', '==', user.uid),
        where('challengeId', '==', challengeId),
        where('completed', '==', false)
      );
      
      const incompleteSnapshot = await getDocs(incompleteQuery);
      if (!incompleteSnapshot.empty) {
        const session = { id: incompleteSnapshot.docs[0].id, ...incompleteSnapshot.docs[0].data() } as TriviaSession;
        setExistingSession(session);
        setSessionId(session.id!);
        setAnswers(session.questions || []);
        setScore(session.score || 0);
        setCurrentQuestionIndex(session.currentQuestionIndex || 0);
      }
      
      setCanPlay(true);
    } catch (error) {
      console.error('Error checking daily limit:', error);
      setCanPlay(true); // Allow play on error
    }
  };

  // Calculate countdown until midnight user's local time
  const updateCountdown = () => {
    if (canPlay) {
      setCountdown('');
      return;
    }
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  useEffect(() => {
    if (sessionStarted && currentQuestionIndex < questions.length) {
      startTimer();
      startTimeRef.current = Date.now();
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [currentQuestionIndex, sessionStarted, questions.length]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      
      // If resuming, use existing questions from session
      if (existingSession && existingSession.questions.length > 0) {
        const formatted = existingSession.questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
        }));
        setQuestions(formatted);
        setIsLoading(false);
        return;
      }
      
      // Fetch questions divided into thirds: 1/3 easy, 1/3 medium, 1/3 hard
      const triviaQuestions = await fetchTriviaQuestionsMixed(
        challenge.questionsCount,
        undefined, // category
        'multiple'
      );
      
      // Format questions and limit to 3 options
      const formatted = triviaQuestions.map(q => formatQuestion(q));
      setQuestions(formatted);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.showError('Failed to load trivia questions');
      setIsLoading(false);
    }
  };

  const startSession = async () => {
    if (!user || !canPlay) return;
    
    try {
      // If resuming existing session
      if (existingSession && sessionId) {
        setSessionStarted(true);
        return;
      }
      
      const sessionData: Omit<TriviaSession, 'id'> = {
        userId: user.uid,
        challengeId: challenge.id!,
        questions: [],
        score: 0,
        totalQuestions: challenge.questionsCount,
        tokensEarned: 0,
        completed: false,
        startedAt: new Date(),
        currentQuestionIndex: 0,
      };
      
      const docRef = await addDoc(collection(db, 'triviaSessions'), {
        ...sessionData,
        startedAt: Timestamp.now(),
      });
      
      setSessionId(docRef.id);
      setSessionStarted(true);
    } catch (error) {
      console.error('Error starting session:', error);
      toast.showError('Failed to start trivia session');
    }
  };

  // Save session state
  const saveSessionState = async () => {
    if (!sessionId || !user) return;
    
    try {
      await updateDoc(doc(db, 'triviaSessions', sessionId), {
        questions: answers,
        score,
        currentQuestionIndex,
        lastUpdated: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error saving session state:', error);
    }
  };

  const startTimer = () => {
    setTimeLeft(challenge.timePerQuestion);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Time's up - mark as incorrect
    handleAnswer(null);
  };

  const handleAnswer = (answer: string | null) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    const timeSpent = challenge.timePerQuestion - timeLeft;
    const isCorrect = answer === currentQuestion.correctAnswer;
    const questionNumber = currentQuestionIndex + 1;
    
    // Check if this question has a bonus multiplier
    const bonusMultiplier = challenge.bonusQuestions?.[questionNumber] || 1;
    
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);
    
    // Record answer
    const answerData = {
      question: currentQuestion.question,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer,
      userAnswer: answer || undefined,
      isCorrect,
      timeSpent,
      questionNumber,
      bonusMultiplier: bonusMultiplier > 1 ? bonusMultiplier : undefined,
    };
    
    const updatedAnswers = [...answers, answerData];
    setAnswers(updatedAnswers);
    setSelectedAnswer(answer);
    
    // Move to next question after a brief delay
    setTimeout(() => {
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentQuestionIndex(nextIndex);
        setSelectedAnswer(null);
      } else {
        // All questions answered, complete session
        completeSession(newScore);
      }
    }, 2000);
  };

  const completeSession = async (finalScore: number) => {
    if (!user || !sessionId) return;
    
    try {
      // Calculate tokens with bonus multipliers
      let tokensEarned = 0;
      answers.forEach((answer) => {
        if (answer.isCorrect) {
          const baseReward = challenge.tokenReward;
          const multiplier = answer.bonusMultiplier || 1;
          tokensEarned += baseReward * multiplier;
        }
      });
      
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Update session
      const sessionRef = doc(db, 'triviaSessions', sessionId);
      await updateDoc(sessionRef, {
        questions: answers,
        score: finalScore,
        tokensEarned,
        completed: true,
        completedAt: Timestamp.now(),
        lastAttemptDate: today,
        currentQuestionIndex: undefined, // Clear resume state
      });
      
      // Add tokens to user
      if (tokensEarned > 0) {
        const bonusCount = answers.filter(a => a.bonusMultiplier && a.bonusMultiplier > 1 && a.isCorrect).length;
        await addTokens(
          user.uid,
          tokensEarned,
          `Trivia Challenge: ${finalScore}/${challenge.questionsCount} correct${bonusCount > 0 ? ` (${bonusCount} bonus questions!)` : ''}`,
          'trivia'
        );
      }
      
      setCanPlay(false);
      updateCountdown();
      onComplete(tokensEarned);
    } catch (error) {
      console.error('Error completing session:', error);
      toast.showError('Error completing trivia challenge');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-white">Loading trivia questions...</p>
        </div>
      </div>
    );
  }

  if (!sessionStarted) {
    // Check if already completed today
    if (!canPlay) {
      return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Challenge Completed!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You've already completed this challenge today. Come back tomorrow for another attempt!
              </p>
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Next attempt available in:</p>
                <p className="text-3xl font-bold text-yellow-600">{countdown}</p>
              </div>
            </div>
            <button
              onClick={onExit}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      );
    }
    
    // Show loading/starting screen (auto-starts)
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Starting Challenge...</h2>
          <p className="text-gray-600 dark:text-gray-400">Preparing your questions</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Score: {score}/{questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="mb-6 text-center">
          <div className={`text-4xl font-bold ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-cyan-500'}`}>
            {timeLeft}s
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentQuestion.question}
            </h3>
            {challenge.bonusQuestions?.[currentQuestionIndex + 1] && (
              <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full">
                ✨ {challenge.bonusQuestions[currentQuestionIndex + 1]}x Bonus!
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              const showResult = selectedAnswer !== null;
              
              let buttonClass = 'w-full px-6 py-4 text-left rounded-lg border-2 transition-all font-medium ';
              
              if (showResult) {
                if (isCorrect) {
                  buttonClass += 'bg-green-500 border-green-600 text-white';
                } else if (isSelected && !isCorrect) {
                  buttonClass += 'bg-red-500 border-red-600 text-white';
                } else {
                  buttonClass += 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400';
                }
              } else {
                buttonClass += 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20';
              }
              
              return (
                <button
                  key={index}
                  onClick={() => !showResult && handleAnswer(option)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResult && isCorrect && (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


