'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { TriviaChallenge } from '@/lib/firebase/types';
import { useToast } from '@/contexts/ToastContext';
import { getTriviaCategories } from '@/lib/trivia/openTriviaDB';
import { useRouter } from 'next/navigation';
import TriviaChallengeComponent from '@/components/trivia/TriviaChallenge';

export default function TriviaManager() {
  const toast = useToast();
  const router = useRouter();
  const [challenges, setChallenges] = useState<TriviaChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<TriviaChallenge | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTrivia, setShowTrivia] = useState(false);
  const [playingChallenge, setPlayingChallenge] = useState<TriviaChallenge | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    questionsCount: 10,
    timePerQuestion: 10,
    tokenReward: 10,
    bonusQuestions: {} as { [questionNumber: number]: number },
    active: true,
  });
  
  const [editingBonus, setEditingBonus] = useState<{ questionNumber: number; multiplier: number } | null>(null);

  useEffect(() => {
    loadChallenges();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cats = await getTriviaCategories();
    setCategories(cats);
  };

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'triviaChallenges'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setChallenges(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as TriviaChallenge[]);
    } catch (error) {
      console.error('Error loading challenges:', error);
      toast.showError('Error loading trivia challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (selectedChallenge?.id) {
        // Update existing
        await updateDoc(doc(db, 'triviaChallenges', selectedChallenge.id), {
          ...formData,
          updatedAt: Timestamp.now(),
        });
        toast.showSuccess('Trivia challenge updated!');
      } else {
        // Create new
        await addDoc(collection(db, 'triviaChallenges'), {
          ...formData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        toast.showSuccess('Trivia challenge created!');
      }
      setShowForm(false);
      setSelectedChallenge(null);
      loadChallenges();
    } catch (error) {
      console.error('Error saving challenge:', error);
      toast.showError('Error saving trivia challenge');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;
    
    try {
      await deleteDoc(doc(db, 'triviaChallenges', id));
      toast.showSuccess('Challenge deleted!');
      loadChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast.showError('Error deleting challenge');
    }
  };

  const handleEdit = (challenge: TriviaChallenge) => {
    setSelectedChallenge(challenge);
    setFormData({
      name: challenge.name,
      questionsCount: challenge.questionsCount,
      timePerQuestion: challenge.timePerQuestion,
      tokenReward: challenge.tokenReward,
      bonusQuestions: challenge.bonusQuestions || {},
      active: challenge.active,
    });
    setShowForm(true);
  };

  const addBonusQuestion = () => {
    if (editingBonus) {
      const newBonus = { ...formData.bonusQuestions };
      if (editingBonus.multiplier > 1) {
        newBonus[editingBonus.questionNumber] = editingBonus.multiplier;
      } else {
        delete newBonus[editingBonus.questionNumber];
      }
      setFormData({ ...formData, bonusQuestions: newBonus });
      setEditingBonus(null);
    }
  };

  const removeBonusQuestion = (questionNumber: number) => {
    const newBonus = { ...formData.bonusQuestions };
    delete newBonus[questionNumber];
    setFormData({ ...formData, bonusQuestions: newBonus });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Trivia Challenges</h2>
          <p className="text-cyan-300/70 text-sm mt-1">Manage trivia challenges and token rewards</p>
        </div>
        <button
          onClick={() => {
            setSelectedChallenge(null);
            setFormData({
              name: '',
              questionsCount: 10,
              timePerQuestion: 10,
              tokenReward: 10,
              bonusQuestions: {},
              active: true,
            });
            setShowForm(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all"
        >
          + New Challenge
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800/60 rounded-xl border border-cyan-500/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {selectedChallenge ? 'Edit Challenge' : 'Create Challenge'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-cyan-200">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white"
                placeholder="Daily Trivia Challenge"
              />
            </div>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-300">
                ℹ️ Questions are automatically divided: 1/3 easy, 1/3 medium, 1/3 hard
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-cyan-200">Questions</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.questionsCount}
                  onChange={(e) => setFormData({ ...formData, questionsCount: parseInt(e.target.value) || 10 })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-cyan-200">Time per Question (s)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={formData.timePerQuestion}
                  onChange={(e) => setFormData({ ...formData, timePerQuestion: parseInt(e.target.value) || 10 })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-cyan-200">Tokens per Correct Answer</label>
                <input
                  type="number"
                  min="1"
                  value={formData.tokenReward}
                  onChange={(e) => setFormData({ ...formData, tokenReward: parseInt(e.target.value) || 10 })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-cyan-200">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                Active (visible to users)
              </label>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all"
              >
                Save Challenge
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedChallenge(null);
                }}
                className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="bg-slate-800/60 rounded-xl border border-cyan-500/20 p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-white">{challenge.name}</h4>
              {challenge.active ? (
                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Active</span>
              ) : (
                <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded">Inactive</span>
              )}
            </div>
            <div className="space-y-1 text-sm text-gray-300 mb-4">
              <div>Questions: {challenge.questionsCount}</div>
              <div>Time: {challenge.timePerQuestion}s per question</div>
              <div>Reward: {challenge.tokenReward} 🪙 per correct answer</div>
              {challenge.bonusQuestions && Object.keys(challenge.bonusQuestions).length > 0 && (
                <div className="text-purple-400">
                  ✨ Bonuses: {Object.entries(challenge.bonusQuestions).map(([q, m]) => `Q${q}:${m}x`).join(', ')}
                </div>
              )}
              <div>Max: {challenge.questionsCount * challenge.tokenReward} 🪙</div>
            </div>
            <div className="flex gap-2">
              {challenge.active && (
                <button
                  onClick={() => {
                    setPlayingChallenge(challenge);
                    setShowTrivia(true);
                  }}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-colors text-sm font-semibold"
                >
                  🎮 Play
                </button>
              )}
              <button
                onClick={() => handleEdit(challenge)}
                className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => challenge.id && handleDelete(challenge.id)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

