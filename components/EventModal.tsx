
import React from 'react';
import { NewsEvent, GameStats } from '../types';

interface EventModalProps {
  event: NewsEvent;
  onResolve: (impact: Partial<GameStats>) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onResolve }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900 p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-red-500 text-2xl animate-pulse">📡</span>
            <h2 className="text-xl font-bold uppercase tracking-tighter text-slate-200">Breaking News</h2>
          </div>
        </div>
        
        <div className="p-8">
          <h3 className="text-2xl font-bold mb-4 text-white">{event.title}</h3>
          <p className="text-slate-300 mb-8 leading-relaxed text-lg">
            {event.description}
          </p>

          <div className="space-y-3">
            {event.options ? (
              event.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => onResolve(opt.impact)}
                  className="w-full text-left p-4 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-emerald-500 transition-all group"
                >
                  <div className="font-bold text-emerald-400 group-hover:text-emerald-300">{opt.label}</div>
                  <div className="text-xs text-slate-400 mt-1">Impact: Decisions will modify your industry trajectory.</div>
                </button>
              ))
            ) : (
              <button
                onClick={() => onResolve({ [event.impact.stat]: event.impact.value })}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all"
              >
                Acknowledge & Proceed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
