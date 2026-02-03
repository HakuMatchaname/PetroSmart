
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStats, GamePhase, NewsEvent, QuizQuestion, Achievement, Upgrades, Language } from './types.ts';
import { Dashboard } from './components/Dashboard.tsx';
import { QuizModule } from './components/QuizModule.tsx';
import { EventModal } from './components/EventModal.tsx';
import { Achievements, ACHIEVEMENTS_LIST } from './components/Achievements.tsx';
import { YearlyReview } from './components/YearlyReview.tsx';
import { Shop } from './components/Shop.tsx';
import { generateNewsEvent, generateQuiz } from './geminiService.ts';
import { sounds } from './soundUtils.ts';
import { UI_STRINGS } from './translations.ts';

const SAVE_KEY = 'petrosmart_game_save_v2';

const INITIAL_UPGRADES: Upgrades = {
  drillLevel: 0,
  refineLevel: 0,
  researchLevel: 0,
  renewableLevel: 0
};

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
  renewableCapacity: 0,
  upgrades: INITIAL_UPGRADES,
  language: 'ID' // Set Indonesian as default
};

const App: React.FC = () => {
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

  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.unlockedAchievements || [];
      } catch (e) { return []; }
    }
    return [];
  });

  const [lastAchievement, setLastAchievement] = useState<Achievement | null>(null);
  const [currentEvent, setCurrentEvent] = useState<NewsEvent | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [lastActionFeedback, setLastActionFeedback] = useState<{ id: number, label: string } | null>(null);

  const feedbackIdCounter = useRef(0);
  const T = UI_STRINGS[stats.language];

  useEffect(() => {
    const newlyUnlocked: string[] = [];
    ACHIEVEMENTS_LIST.forEach(ach => {
      if (!unlockedAchievements.includes(ach.id) && ach.criteria(stats)) {
        newlyUnlocked.push(ach.id);
        setLastAchievement(ach);
        sounds.playSuccess();
        setTimeout(() => setLastAchievement(null), 5000);
      }
    });

    if (newlyUnlocked.length > 0) {
      setUnlockedAchievements(prev => [...prev, ...newlyUnlocked]);
    }
  }, [stats, unlockedAchievements]);

  const saveGame = () => {
    sounds.playClick();
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      phase,
      stats,
      history,
      unlockedAchievements
    }));
    setSaveFeedback(T.saved);
    setTimeout(() => setSaveFeedback(null), 2500);
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
    
    setStats({ ...INITIAL_STATS, language: stats.language });
    setHistory([{ ...INITIAL_STATS, language: stats.language }]);
    setUnlockedAchievements([]);
    setCurrentEvent(null);
    setCurrentQuiz(null);
    setShowRestartConfirm(false);
    
    setPhase(GamePhase.PLAYING);
  };

  const handleExit = () => {
    sounds.playClick();
    setPhase(GamePhase.MENU);
  };

  const handleLanguageChange = (lang: Language) => {
    sounds.playClick();
    setStats(prev => ({ ...prev, language: lang }));
  };

  const handlePurchaseUpgrade = (id: keyof Upgrades, cost: number) => {
    setStats(prev => ({
      ...prev,
      cash: prev.cash - cost,
      upgrades: {
        ...prev.upgrades,
        [id]: prev.upgrades[id] + 1
      }
    }));
    setLastActionFeedback({ id: feedbackIdCounter.current++, label: stats.language === 'ID' ? "Sistem Diperbarui!" : "System Upgraded!" });
    setTimeout(() => setLastActionFeedback(null), 2000);
  };

  const handleAction = (type: 'DRILL' | 'REFINE' | 'RESEARCH' | 'RENEWABLE' | 'SKIP_TURN') => {
    if (stats.turnsRemaining <= 0 || phase !== GamePhase.PLAYING) return;

    setStats(prev => {
      let next = { ...prev };
      let success = false;
      let label = "";
      
      const up = next.upgrades;

      switch (type) {
        case 'DRILL':
          const drillCost = 100000 * (1 + (up.researchLevel * 0.15));
          if (next.cash >= drillCost) {
            next.cash -= drillCost;
            const drillYield = 50000 + (up.drillLevel * 15000);
            next.crudeOil += drillYield;
            next.pollution += (2 + (up.drillLevel * 1));
            next.turnsRemaining -= 1;
            success = true;
            label = `${T.drill} +${Math.round(drillYield/1000)}rb`;
          }
          break;
        case 'REFINE':
          if (next.crudeOil >= 10000) {
            next.crudeOil -= 10000;
            const revenue = 150000 + (up.refineLevel * 50000);
            next.refinedProducts += 9000;
            next.cash += revenue;
            next.pollution += (3 + (up.refineLevel * 2));
            next.turnsRemaining -= 1;
            success = true;
            label = `${T.refine} +$${Math.round(revenue/1000)}rb`;
          }
          break;
        case 'RESEARCH':
          if (next.cash >= 50000) {
            next.cash -= 50000;
            const knowledgeGain = 10 + (up.researchLevel * 5);
            next.knowledge += knowledgeGain;
            next.turnsRemaining -= 1;
            success = true;
            label = `${T.research} +${knowledgeGain}`;
          }
          break;
        case 'RENEWABLE':
          const renewCost = 200000 + (up.renewableLevel * 50000);
          if (next.cash >= renewCost) {
            next.cash -= renewCost;
            const capGain = (5 + (up.renewableLevel * 2)) * (1 - (up.drillLevel * 0.1));
            next.renewableCapacity += Math.max(0.1, capGain);
            next.pollution = Math.max(0, next.pollution - 5);
            next.turnsRemaining -= 1;
            success = true;
            label = `${T.renewable} +${capGain.toFixed(1)}GW`;
          }
          break;
        case 'SKIP_TURN':
          next.turnsRemaining -= 1;
          success = true;
          label = T.skip;
          break;
      }

      if (success) {
        sounds.playAction();
        const fid = feedbackIdCounter.current++;
        setLastActionFeedback({ id: fid, label });
        setTimeout(() => setLastActionFeedback(prev => prev?.id === fid ? null : prev), 2000);
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
    
    const gainMultiplier = Math.pow(0.95, next.upgrades.refineLevel);
    const approvalBonus = (next.renewableCapacity / 10) * gainMultiplier;
    const pollutionPenalty = (next.pollution / 20);
    
    next.approval = Math.min(100, Math.max(0, next.approval + approvalBonus - pollutionPenalty));
    
    const wasMonth12 = next.month === 12;

    next.month += 1;
    next.turnsRemaining = 5;

    if (next.month > 12) {
      next.month = 1;
      next.year += 1;
    }

    if (wasMonth12) {
      setPhase(GamePhase.YEARLY_REVIEW);
    } else {
      const totalMonths = (next.year - 2024) * 12 + next.month;
      if (totalMonths % 4 === 0) {
        triggerEvent(next);
      } else if (totalMonths % 3 === 0) {
        triggerQuiz(next.knowledge, next.language);
      }
    }

    if (next.pollution >= 100 || next.approval <= 0 || next.cash < -500000) {
      sounds.playGameOver();
      setPhase(GamePhase.GAMEOVER);
    }

    return next;
  };

  const triggerEvent = async (currentStats: GameStats) => {
    const event = await generateNewsEvent(currentStats);
    sounds.playAiChime();
    setCurrentEvent(event);
    setPhase(GamePhase.EVENT);
  };

  const triggerQuiz = async (knowledge: number, lang: Language) => {
    const quiz = await generateQuiz(knowledge, lang);
    sounds.playAiChime();
    setCurrentQuiz(quiz);
    setPhase(GamePhase.QUIZ);
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

  const renderScreen = () => {
    switch (phase) {
      case GamePhase.MENU:
        return (
          <div className="animate-fade-in-up min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-8 p-4 bg-amber-500/10 rounded-full border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <span className="text-6xl animate-pulse inline-block">🛢️</span>
            </div>
            <h1 className="text-6xl font-black mb-4 tracking-tighter text-white">
              {T.title}
            </h1>
            <p className="text-xl text-slate-400 max-w-xl mb-4">
              {T.subtitle}
            </p>
            <p className="text-sm text-slate-500 max-w-lg mb-8 italic">
              {T.turnsHelp}
            </p>

            <div className="mb-8 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{T.langLabel}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleLanguageChange('ID')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${stats.language === 'ID' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  Bahasa Indonesia
                </button>
                <button 
                  onClick={() => handleLanguageChange('EN')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${stats.language === 'EN' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full max-sm px-4">
              {history.length > 1 && (
                <button
                  onClick={() => { sounds.playMenuTransition(); setPhase(GamePhase.PLAYING); }}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xl rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-amber-500/30"
                >
                  {T.resume}
                </button>
              )}
              <button
                onClick={initiateRestart}
                className={`w-full py-4 font-black text-xl rounded-full transition-all transform hover:scale-105 active:scale-95 ${
                  history.length > 1 
                  ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700' 
                  : 'bg-amber-500 text-slate-950 shadow-2xl shadow-amber-500/30'
                }`}
              >
                {history.length > 1 ? T.restart : T.newGame}
              </button>
            </div>
          </div>
        );

      case GamePhase.GAMEOVER:
        return (
          <div className="animate-fade-in min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-5xl font-bold mb-4 text-red-500">{T.gameOverTitle}</h1>
            <p className="text-xl text-slate-300 mb-8 max-w-lg">
              {stats.pollution >= 100 ? T.gameOverPollution : 
               stats.approval <= 0 ? T.gameOverApproval : 
               T.gameOverCash}
            </p>
            <div className="bg-slate-800 p-8 rounded-2xl mb-8 w-full max-w-md border border-slate-700 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4">{T.finalScore}</h2>
              <div className="space-y-2 text-left">
                <div className="flex justify-between"><span>{T.yearsActive}:</span> <b>{stats.year - 2024} Tahun</b></div>
                <div className="flex justify-between"><span>{T.totalWealth}:</span> <b>${stats.cash.toLocaleString()}</b></div>
                <div className="flex justify-between"><span>{T.knowledge}:</span> <b>{stats.knowledge} Poin</b></div>
                <div className="flex justify-between"><span>{T.renewableCap}:</span> <b>{stats.renewableCapacity.toFixed(1)} GW</b></div>
              </div>
            </div>
            <button
              onClick={() => { sounds.playClick(); setPhase(GamePhase.MENU); }}
              className="px-8 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors shadow-lg active:scale-95"
            >
              {T.returnHq}
            </button>
          </div>
        );

      default:
        return (
          <div className="animate-fade-in min-h-screen p-4 lg:p-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-800 pb-6">
              <div className="flex items-center gap-6">
                <div>
                  <h1 className="text-3xl font-black tracking-tighter text-white">PETRO<span className="text-amber-500">SMART</span></h1>
                  <p className="text-slate-500 text-sm">{stats.language === 'ID' ? 'Sistem Kendali Strategis' : 'Strategic Control System'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExit}
                    className="px-3 py-1 text-xs font-bold text-slate-400 border border-slate-700 rounded hover:bg-slate-800 transition-all uppercase tracking-widest flex items-center gap-2"
                  >
                    <span>🚪</span> {T.exit}
                  </button>
                  <button 
                    onClick={saveGame}
                    className={`px-3 py-1 text-xs font-bold rounded transition-all uppercase tracking-widest relative overflow-hidden group ${
                      saveFeedback ? 'bg-emerald-500 text-slate-950 scale-105' : 'text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10'
                    }`}
                  >
                    <span className="relative z-10">{saveFeedback ? T.saved : T.save}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 shadow-lg">
                 <div className="text-right">
                   <div className="text-xs text-slate-500 uppercase font-bold">{T.monthProgress}</div>
                   <div className="text-emerald-400 font-mono">{T.turnsRemaining}: {stats.turnsRemaining}/5</div>
                 </div>
                 <div className="h-8 w-[1px] bg-slate-700"></div>
                 <div className="text-right">
                   <div className="text-xs text-slate-500 uppercase font-bold">Status</div>
                   <div className="text-blue-400 animate-pulse font-mono uppercase">{T.operational}</div>
                 </div>
              </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              <div className="xl:col-span-3">
                <Dashboard stats={stats} history={history} />
                
                <div className="mt-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 relative">
                  {lastActionFeedback && (
                    <div key={lastActionFeedback.id} className="absolute -top-10 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-lg animate-float-up">
                      {lastActionFeedback.label}
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <span className="text-amber-500">🛠️</span> {T.monthlyActions} <span className="text-xs font-normal text-slate-400 font-mono">{T.oneTurnEach}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <ActionButton 
                      onClick={() => handleAction('DRILL')} 
                      disabled={stats.cash < (100000 * (1 + (stats.upgrades.researchLevel * 0.15))) || stats.turnsRemaining <= 0}
                      icon="🏗️" label={T.drill} cost={`$${Math.round((100000 * (1 + (stats.upgrades.researchLevel * 0.15)))/1000)}rb`}
                      color="hover:border-amber-500 hover:shadow-amber-500/20 active-glow-amber"
                    />
                    <ActionButton 
                      onClick={() => handleAction('REFINE')} 
                      disabled={stats.crudeOil < 10000 || stats.turnsRemaining <= 0}
                      icon="🔥" label={T.refine} cost="10rb bbl"
                      color="hover:border-purple-500 hover:shadow-purple-500/20 active-glow-purple"
                    />
                    <ActionButton 
                      onClick={() => handleAction('RESEARCH')} 
                      disabled={stats.cash < 50000 || stats.turnsRemaining <= 0}
                      icon="🧪" label={T.research} cost="$50rb"
                      color="hover:border-indigo-500 hover:shadow-indigo-500/20 active-glow-indigo"
                    />
                    <ActionButton 
                      onClick={() => handleAction('RENEWABLE')} 
                      disabled={stats.cash < (200000 + (stats.upgrades.renewableLevel * 50000)) || stats.turnsRemaining <= 0}
                      icon="🌬️" label={T.renewable} cost={`$${Math.round((200000 + (stats.upgrades.renewableLevel * 50000))/1000)}rb`}
                      color="hover:border-green-500 hover:shadow-green-500/20 active-glow-green"
                    />
                    <button
                      onClick={() => handleAction('SKIP_TURN')}
                      disabled={stats.turnsRemaining <= 0}
                      className="flex flex-col items-center justify-center p-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all border border-slate-600 hover:scale-[1.02] active:scale-95 hover:shadow-lg hover:shadow-slate-500/10 disabled:opacity-30 disabled:grayscale"
                    >
                      <span className="text-2xl mb-1">⏳</span>
                      <span className="font-bold">{T.skip}</span>
                      <span className="text-xs text-slate-400 font-mono mt-1">{T.noCost}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Shop 
                  upgrades={stats.upgrades} 
                  currentCash={stats.cash} 
                  onPurchase={handlePurchaseUpgrade} 
                  lang={stats.language}
                />
                
                <Achievements unlockedIds={unlockedAchievements} lang={stats.language} />

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{T.marketIntel}</h3>
                  <div className="space-y-4 max-h-[250px] overflow-y-auto font-mono text-xs custom-scrollbar">
                    <div className="text-emerald-400 border-l-2 border-emerald-500 pl-2 py-1">
                      &gt; AKSI {6 - stats.turnsRemaining} PADA BULAN {stats.month}<br/>
                      &gt; MENGANALISIS PERMINTAAN GLOBAL...
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {phase === GamePhase.EVENT && currentEvent && (
              <EventModal event={currentEvent} onResolve={resolveEvent} lang={stats.language} />
            )}

            {phase === GamePhase.QUIZ && currentQuiz && (
              <QuizModule question={currentQuiz} onComplete={resolveQuiz} lang={stats.language} />
            )}

            {phase === GamePhase.YEARLY_REVIEW && (
              <YearlyReview 
                currentStats={stats} 
                history={history} 
                onContinue={() => {
                  sounds.playMenuTransition();
                  setPhase(GamePhase.PLAYING);
                }} 
              />
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 transition-colors duration-1000 overflow-x-hidden">
      {lastAchievement && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] bg-amber-500 text-slate-950 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce-in ring-4 ring-amber-400/50">
          <div className="text-3xl">{lastAchievement.icon}</div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest opacity-70">{stats.language === 'ID' ? 'Pencapaian Baru!' : 'Milestone Unlocked!'}</div>
            <div className="text-xl font-black leading-tight">{lastAchievement.title[stats.language]}</div>
          </div>
        </div>
      )}

      {renderScreen()}

      <style>{`
        @keyframes bounce-in {
          0% { transform: translate(-50%, -200%); }
          60% { transform: translate(-50%, 20%); }
          80% { transform: translate(-50%, -10%); }
          100% { transform: translate(-50%, 0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes float-up {
          0% { opacity: 0; transform: translate(-50%, 0); }
          20% { opacity: 1; transform: translate(-50%, -10px); }
          80% { opacity: 1; transform: translate(-50%, -30px); }
          100% { opacity: 0; transform: translate(-50%, -40px); }
        }
        @keyframes active-glow {
          0%, 100% { box-shadow: 0 0 5px currentColor; }
          50% { box-shadow: 0 0 15px currentColor; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }
        .active-glow-amber:not(:disabled) { animation: active-glow 2s infinite; color: #f59e0b; }
        .active-glow-purple:not(:disabled) { animation: active-glow 2.5s infinite; color: #a855f7; }
        .active-glow-indigo:not(:disabled) { animation: active-glow 3s infinite; color: #6366f1; }
        .active-glow-green:not(:disabled) { animation: active-glow 2.2s infinite; color: #22c55e; }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
      `}</style>
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
        ? 'opacity-25 grayscale cursor-not-allowed border-slate-800 scale-95' 
        : `hover:bg-slate-700/80 hover:scale-[1.05] active:scale-95 hover:shadow-2xl shadow-black/40 ${color}`
    }`}
  >
    <span className={`text-3xl mb-1 transition-transform ${!disabled && 'group-hover:scale-110'}`}>{icon}</span>
    <span className="font-bold text-slate-200 truncate w-full text-center text-xs px-1">{label}</span>
    <span className="text-[10px] text-slate-500 font-mono mt-1">{cost}</span>
  </button>
);

export default App;
