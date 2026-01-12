
import React, { useState } from 'react';
import { QuizQuestion } from '../types';

interface QuizModuleProps {
  question: QuizQuestion;
  onComplete: (correct: boolean) => void;
}

export const QuizModule: React.FC<QuizModuleProps> = ({ question, onComplete }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedIndex(index);
    setShowExplanation(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-indigo-500/50 w-full max-w-2xl rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-500/20 rounded-lg">
            <span className="text-2xl">🎓</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-indigo-400">Educational Milestone</h2>
            <p className="text-slate-400 text-sm">Correct answers boost your Knowledge and Funds!</p>
          </div>
        </div>

        <h3 className="text-xl font-medium mb-6 leading-relaxed">
          {question.question}
        </h3>

        <div className="grid grid-cols-1 gap-3 mb-8">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={showExplanation}
              className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                showExplanation
                  ? idx === question.correctIndex
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                    : idx === selectedIndex
                    ? 'bg-red-500/20 border-red-500 text-red-200'
                    : 'bg-slate-700/50 border-slate-600 opacity-50'
                  : 'bg-slate-700 hover:bg-slate-600 border-slate-600 hover:border-indigo-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {showExplanation && idx === question.correctIndex && <span>✅</span>}
                {showExplanation && idx === selectedIndex && idx !== question.correctIndex && <span>❌</span>}
              </div>
            </button>
          ))}
        </div>

        {showExplanation && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-slate-700/50 p-4 rounded-lg border-l-4 border-indigo-500">
              <p className="text-slate-300 italic">"{question.explanation}"</p>
            </div>
            <button
              onClick={() => onComplete(selectedIndex === question.correctIndex)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
            >
              Continue Mission
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
