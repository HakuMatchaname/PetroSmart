
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStats, GamePhase, NewsEvent, QuizQuestion } from './types';
import { Dashboard } from './components/Dashboard';
import { QuizModule } from './components/QuizModule';
import { EventModal } from './components/EventModal';
import { generateNewsEvent, generateQuiz } from './geminiService';
import { sounds } from './soundUtils';

const SAVE_KEY = 'petrosmart_game_save';

const INITIAL_STATS: GameStats = {
  year: 2024,
  month: 1,
  turnsRemaining: 5,
  cash: 1000000,
  crudeOil: 0,
  refinedProducts: 0,
  pollution: 5,
  approval: 80,
  knowledge: 0,
  renewableCapacity: 0
};

const App: React.FC = () => {
  // State Initialization
  const [phase, setPhase] = useState<GamePhase>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.phase || GamePhase.MENU;
      } catch (e) { return GamePhase.MENU; }
    }
    return GamePhase.MENU;
  });

  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.stats || INITIAL_STATS;
      } catch (e) { return INITIAL_STATS; }
    }
    return INITIAL_STATS;
  });

  const [history, setHistory] = useState<GameStats[]>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.history || [INITIAL_STATS];
      } catch (e) { return [INITIAL_STATS]; }
    }
    return [INITIAL_STATS];
  });

  const [currentEvent, setCurrentEvent] = useState<NewsEvent | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const requestCounter = useRef(0);

  const saveGame = () => {
    sounds.playClick();
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      phase,
      stats,
      history
    }));
    setSaveFeedback("Progress Saved!");
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const initiateRestart = () => {
    sounds.playClick();
    const hasActiveProgress = history.length > 1 || localStorage.getItem(SAVE_KEY) !== null;
    if (hasActiveProgress) {
      setShowRestartConfirm(true);
    } else {
      executeRestart();
    }
  };

  const executeRestart = () => {
    sounds.playMenuTransition();
    localStorage.removeItem(SAVE_KEY);
    
    // Hard reset all state
    setStats(INITIAL_STATS);
    setHistory([INITIAL_STATS]);
    setCurrentEvent(null);
    setCurrentQuiz(null);
    setIsLoading(false);
    setShowRestartConfirm(false);
    
    setPhase(GamePhase.PLAYING);
    requestCounter.current++; // Invalidate pending AI requests
  };

  const handleExit = () => {
    sounds.playClick();
    setPhase(GamePhase.MENU);
  };

  const handleCancelLoading = () => {
    sounds.playClick();
    requestCounter.current++;
    setIsLoading(false);
  };

  const handleAction = (type: 'DRILL' | 'REFINE' | 'RESEARCH' | 'RENEWABLE' | 'SKIP_TURN') => {
    if (isLoading || stats.turnsRemaining <= 0) return;

    setStats(prev => {
      let next = { ...prev };
      let success = false;
      
      switch (type) {
        case 'DRILL':
          if (next.cash >= 100000) {
            next.cash -= 100000;
            next.crudeOil += 50000;
            next.pollution += 2;
            next.turnsRemaining -= 1;
            success = true;
          }
          break;
        case 'REFINE':
          if (next.crudeOil >= 10000) {
            next.crudeOil -= 10000;
            next.refinedProducts += 9000;
            next.cash += 150000;
            next.pollution += 3;
            next.turnsRemaining -= 1;
            success = true;
          }
          break;
        case 'RESEARCH':
          if (next.cash >= 50000) {
            next.cash -= 50000;
            next.knowledge += 10;
            next.turnsRemaining -= 1;
            success = true;
          }
          break;
        case 'RENEWABLE':
          if (next.cash >= 200000) {
            next.cash -= 200000;
            next.renewableCapacity += 5;
            next.pollution = Math.max(0, next.pollution - 5);
            next.turnsRemaining -= 1;
            success = true;
          }
          break;
        case 'SKIP_TURN':
          next.turnsRemaining -= 1;
          success = true;
          break;
      }

      if (success) {
        sounds.playAction();
      }

      const recordPoint = { ...next };

      if (next.turnsRemaining === 0) {
        const finalOfMonth = processEndOfMonth(next);
        setHistory(prevHist => [...prevHist, recordPoint, finalOfMonth]);
        return finalOfMonth;
      }

      setHistory(prevHist => [...prevHist, recordPoint]);
      return next;
    });
  };

  const processEndOfMonth = (currentStats: GameStats): GameStats => {
    let next = { ...currentStats };
    next.cash += next.renewableCapacity * 5000; 
    next.approval = Math.min(100, next.approval + (next.renewableCapacity / 10) - (next.pollution / 20));
    
    next.month += 1;
    next.turnsRemaining = 5;

    if (next.month > 12) {
      next.month = 1;
      next.year += 1;
    }

    const totalMonths = (next.year - 2024) * 12 + next.month;
    if (totalMonths % 4 === 0) {
      setTimeout(() => triggerEvent(next), 100);
    } else if (totalMonths % 3 === 0) {
      setTimeout(() => triggerQuiz(), 100);
    }

    if (next.pollution >= 100 || next.approval <= 0 || next.cash < -500000) {
      sounds.playGameOver();
      setPhase(GamePhase.GAMEOVER);
    }

    return next;
  };

  const triggerEvent = async (currentStats: GameStats) => {
    setIsLoading(true);
    const requestId = ++requestCounter.current;
    try {
      const event = await generateNewsEvent(currentStats.year, currentStats.pollution);
      if (requestCounter.current !== requestId) return;
      sounds.playAiChime();
      setCurrentEvent(event);
      setPhase(GamePhase.EVENT);
    } catch (err) {
      console.error(err);
    } finally {
      if (requestCounter.current === requestId) {
        setIsLoading(false);
      }
    }
  };

  const triggerQuiz = async () => {
    setIsLoading(true);
    const requestId = ++requestCounter.current;
    try {
      const quiz = await generateQuiz();
      if (requestCounter.current !== requestId) return;
      sounds.playAiChime();
      setCurrentQuiz(quiz);
      setPhase(GamePhase.QUIZ);
    } catch (err) {
      console.error(err);
    } finally {
      if (requestCounter.current === requestId) {
        setIsLoading(false);
      }
    }
  };

  const resolveEvent = (impact: Partial<GameStats>) => {
    sounds.playClick();
    setStats(prev => {
      const next = { ...prev, ...impact };
      setHistory(h => [...h, next]);
      return next;
    });
    setCurrentEvent(null);
    setPhase(GamePhase.PLAYING);
  };

  const resolveQuiz = (correct: boolean) => {
    if (correct) {
      sounds.playSuccess();
      setStats(prev => {
        const next = {
          ...prev,
          knowledge: prev.knowledge + 20,
          cash: prev.cash + 100000,
          approval: Math.min(100, prev.approval + 5)
        };
        setHistory(h => [...h, next]);
        return next;
      });
    } else {
      sounds.playAction();
    }
    setCurrentQuiz(null);
    setPhase(GamePhase.PLAYING);
  };

  if (phase === GamePhase.MENU) {
    const hasSave = history.length > 1;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
        <div className="mb-8 p-4 bg-amber-500/10 rounded-full border border-amber-500/20">
          <span className="text-6xl">🛢️</span>
        </div>
        <h1 className="text-6xl font-black mb-4 tracking-tighter">
          PETRO<span className="text-amber-500">SMART</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-xl mb-12">
          Master the petroleum industry, manage the environment, and lead the global energy transition. 
          Each month gives you 5 critical decision turns. Use them wisely!
        </p>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {hasSave && (
            <button
              onClick={() => { sounds.playMenuTransition(); setPhase(GamePhase.PLAYING); }}
              className="px-12 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xl rounded-full transition-all transform hover:scale-105 shadow-2xl shadow-amber-500/20"
            >
              RESUME OPERATION
            </button>
          )}
          <button
            onClick={initiateRestart}
            className={`px-12 py-4 font-black text-xl rounded-full transition-all transform hover:scale-105 ${
              hasSave 
              ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700' 
              : 'bg-amber-500 text-slate-950 shadow-2xl shadow-amber-500/20'
            }`}
          >
            {hasSave ? 'RESTART MISSION' : 'NEW GAME'}
          </button>
        </div>

        {showRestartConfirm && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[200] backdrop-blur-md">
            <div className="bg-slate-900 border-2 border-red-500/50 p-8 rounded-3xl max-w-md w-full shadow-2xl">
              <div className="text-red-500 text-5xl mb-4 text-center">⚠️</div>
              <h2 className="text-2xl font-black text-white mb-4 text-center">Confirm Mission Reset</h2>
              <p className="text-slate-400 mb-8 text-center leading-relaxed">
                Warning: This will permanently purge all current operational progress and financial history. This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={executeRestart}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-all shadow-lg shadow-red-500/20"
                >
                  PURGE & RESTART
                </button>
                <button
                  onClick={() => { sounds.playClick(); setShowRestartConfirm(false); }}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                >
                  ABORT RESET
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === GamePhase.GAMEOVER) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-900">
        <h1 className="text-5xl font-bold mb-4 text-red-500">Operation Terminated</h1>
        <p className="text-xl text-slate-300 mb-8">
          {stats.pollution >= 100 ? "Environmental collapse led to global sanctions." : 
           stats.approval <= 0 ? "Massive public protests forced your resignation." : 
           "Your industry has declared bankruptcy."}
        </p>
        <div className="bg-slate-800 p-8 rounded-2xl mb-8 w-full max-w-md border border-slate-700">
          <h2 className="text-2xl font-bold mb-4">Final Score</h2>
          <div className="space-y-2 text-left">
            <div className="flex justify-between"><span>Years Active:</span> <b>{stats.year - 2024}</b></div>
            <div className="flex justify-between"><span>Total Wealth:</span> <b>${stats.cash.toLocaleString()}</b></div>
            <div className="flex justify-between"><span>Knowledge:</span> <b>{stats.knowledge}</b></div>
            <div className="flex justify-between"><span>Renewable Capacity:</span> <b>{stats.renewableCapacity} GW</b></div>
          </div>
        </div>
        <button
          onClick={() => { sounds.playClick(); setPhase(GamePhase.MENU); }}
          className="px-8 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors shadow-lg"
        >
          Return to HQ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 lg:p-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">PETRO<span className="text-amber-500">SMART</span></h1>
            <p className="text-slate-500 text-sm">Decision Engine Active &gt; Monthly Cycle</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExit}
              title="Return to menu without saving"
              className="px-3 py-1 text-xs font-bold text-slate-400 border border-slate-700 rounded hover:bg-slate-800 transition-all uppercase tracking-widest flex items-center gap-2"
            >
              <span>🚪</span> Exit to HQ
            </button>
            <button 
              onClick={saveGame}
              className="px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/10 transition-all uppercase tracking-widest relative"
            >
              Save Game
              {saveFeedback && (
                <span className="absolute -bottom-6 left-0 w-full text-[10px] text-emerald-500 animate-fade-out font-mono text-center">
                  {saveFeedback}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
           <div className="text-right">
             <div className="text-xs text-slate-500 uppercase font-bold">Month Progress</div>
             <div className="text-emerald-400 font-mono">TURNS: {stats.turnsRemaining}/5</div>
           </div>
           <div className="h-8 w-[1px] bg-slate-700"></div>
           <div className="text-right">
             <div className="text-xs text-slate-500 uppercase font-bold">Status</div>
             <div className="text-blue-400 animate-pulse font-mono">READY</div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <Dashboard stats={stats} history={history} />
          
          <div className="mt-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="text-amber-500">🛠️</span> Monthly Command Actions <span className="text-xs font-normal text-slate-400 font-mono">(1 Turn Each)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <ActionButton 
                onClick={() => handleAction('DRILL')} 
                disabled={stats.cash < 100000}
                icon="🏗️" label="Drill Site" cost="$100k"
                color="hover:border-amber-500 hover:shadow-amber-500/20"
              />
              <ActionButton 
                onClick={() => handleAction('REFINE')} 
                disabled={stats.crudeOil < 10000}
                icon="🔥" label="Refine Crude" cost="10k bbl"
                color="hover:border-purple-500 hover:shadow-purple-500/20"
              />
              <ActionButton 
                onClick={() => handleAction('RESEARCH')} 
                disabled={stats.cash < 50000}
                icon="🧪" label="R&D Lab" cost="$50k"
                color="hover:border-indigo-500 hover:shadow-indigo-500/20"
              />
              <ActionButton 
                onClick={() => handleAction('RENEWABLE')} 
                disabled={stats.cash < 200000}
                icon="🌬️" label="Clean Energy" cost="$200k"
                color="hover:border-green-500 hover:shadow-green-500/20"
              />
              <button
                onClick={() => handleAction('SKIP_TURN')}
                className="flex flex-col items-center justify-center p-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all border border-slate-600 hover:scale-[1.02] active:scale-95 hover:shadow-lg hover:shadow-slate-500/10"
              >
                <span className="text-2xl mb-1">⏳</span>
                <span className="font-bold">Wait/Skip</span>
                <span className="text-xs text-slate-400 font-mono mt-1">No Cost</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Market Intel</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto font-mono text-xs">
              <div className="text-emerald-400 border-l-2 border-emerald-500 pl-2 py-1">
                &gt; TURN {6 - stats.turnsRemaining} OF MONTH {stats.month}<br/>
                &gt; ANALYZING GLOBAL DEMAND...
              </div>
              {history.length > 1 && history.slice(-5).reverse().map((h, i) => (
                <div key={i} className="text-slate-500 border-l-2 border-slate-700 pl-2 py-1">
                  &gt; Y{h.year} M{h.month} LOG:<br/>
                  - POLLUTION: {h.pollution}%<br/>
                  - RENEWABLES: {h.renewableCapacity}GW
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-900/10 p-6 rounded-2xl border border-amber-500/20">
            <h3 className="text-lg font-bold text-amber-300 mb-2">Did You Know?</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Petroleum isn't just fuel. Over 6,000 products are made from oil, including plastics, medicines, and fertilizers. Managing it responsibly is key!
            </p>
          </div>
        </div>
      </div>

      {phase === GamePhase.EVENT && currentEvent && (
        <EventModal event={currentEvent} onResolve={resolveEvent} />
      )}

      {phase === GamePhase.QUIZ && currentQuiz && (
        <QuizModule question={currentQuiz} onComplete={resolveQuiz} />
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-slate-950/80 flex flex-col items-center justify-center z-[100] backdrop-blur-md">
           <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-amber-500 font-black animate-pulse tracking-widest uppercase mb-6">Consulting AI Experts...</p>
           <button 
            onClick={handleCancelLoading}
            className="px-6 py-2 bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-all font-bold uppercase tracking-widest text-xs"
           >
            Cancel Consultation
           </button>
        </div>
      )}
    </div>
  );
};

const ActionButton: React.FC<{ 
  onClick: () => void; 
  disabled: boolean; 
  icon: string; 
  label: string; 
  cost: string;
  color: string;
}> = ({ onClick, disabled, icon, label, cost, color }) => (
  <button
    onClick={() => { if (!disabled) { sounds.playClick(); onClick(); } }}
    disabled={disabled}
    className={`flex flex-col items-center justify-center p-4 bg-slate-800 rounded-xl border border-slate-700 transition-all duration-300 ${
      disabled 
        ? 'opacity-25 grayscale cursor-not-allowed border-slate-800' 
        : `hover:bg-slate-700/80 hover:scale-[1.02] active:scale-95 hover:shadow-xl shadow-black/40 ${color}`
    }`}
  >
    <span className={`text-3xl mb-1 transition-transform ${!disabled && 'group-hover:scale-110'}`}>{icon}</span>
    <span className="font-bold text-slate-200">{label}</span>
    <span className="text-xs text-slate-500 font-mono mt-1">{cost}</span>
  </button>
);

export default App;
