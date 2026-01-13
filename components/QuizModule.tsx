
import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { sounds } from '../soundUtils';

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
    sounds.playClick();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-indigo-500/50 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-6 border-b border-indigo-500/20 flex items-center gap-3 shrink-0">
          <div className="p-3 bg-indigo-500/20 rounded-lg">
            <span className="text-2xl">🎓</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-indigo-400 leading-none">AI Expert Consultation</h2>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Educational Milestone</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <h3 className="text-xl font-medium mb-8 leading-relaxed text-slate-100">
            {question.question}
          </h3>

          <div className="grid grid-cols-1 gap-4 mb-8">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={showExplanation}
                className={`text-left p-4 rounded-xl border transition-all duration-200 group ${
                  showExplanation
                    ? idx === question.correctIndex
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                      : idx === selectedIndex
                      ? 'bg-red-500/20 border-red-500 text-red-200'
                      : 'bg-slate-700/50 border-slate-600 opacity-50'
                    : 'bg-slate-700/80 hover:bg-slate-700 border-slate-600 hover:border-indigo-400 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex-1">{option}</span>
                  {showExplanation && idx === question.correctIndex && <span className="ml-2">✅</span>}
                  {showExplanation && idx === selectedIndex && idx !== question.correctIndex && <span className="ml-2">❌</span>}
                </div>
              </button>
            ))}
          </div>

          {showExplanation && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-indigo-500/10 p-5 rounded-xl border-l-4 border-indigo-500">
                <h4 className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-2">Expert Feedback</h4>
                <p className="text-slate-300 italic leading-relaxed">"{question.explanation}"</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {showExplanation && (
          <div className="p-6 bg-slate-900 border-t border-slate-700 shrink-0">
            <button
              onClick={() => onComplete(selectedIndex === question.correctIndex)}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 transform active:scale-95"
            >
              Continue Mission
            </button>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};
