
import React, { useMemo } from 'react';
import { GameStats } from '../types';
import { sounds } from '../soundUtils';
import { UI_STRINGS } from '../translations';

interface YearlyReviewProps {
  currentStats: GameStats;
  history: GameStats[];
  onContinue: () => void;
}

export const YearlyReview: React.FC<YearlyReviewProps> = ({ currentStats, history, onContinue }) => {
  const T = UI_STRINGS[currentStats.language];
  const reviewData = useMemo(() => {
    const yearEnded = currentStats.month === 1 ? currentStats.year - 1 : currentStats.year;
    const startOfYearStats = history.find(h => h.year === yearEnded && h.month === 1) || history[0];

    const cashGrowth = currentStats.cash - startOfYearStats.cash;
    const pollutionReduction = startOfYearStats.pollution - currentStats.pollution;
    const renewableGrowth = currentStats.renewableCapacity - startOfYearStats.renewableCapacity;
    const approvalChange = currentStats.approval - startOfYearStats.approval;
    const refinedProduced = currentStats.refinedProducts - startOfYearStats.refinedProducts;
    const crudeProduced = currentStats.crudeOil - startOfYearStats.crudeOil;
    const knowledgeGained = currentStats.knowledge - startOfYearStats.knowledge;

    const score = Math.max(0, Math.floor(
      (cashGrowth / 5000) + 
      (renewableGrowth * 50) + 
      (approvalChange * 10) +
      (knowledgeGained * 5) +
      (pollutionReduction * 20)
    ));

    let grade = 'C';
    if (score > 3000) grade = 'S';
    else if (score > 1500) grade = 'A';
    else if (score > 700) grade = 'B';
    else if (score < 0) grade = 'D';

    return {
      year: yearEnded,
      cashGrowth,
      pollutionReduction,
      renewableGrowth,
      approvalChange,
      refinedProduced,
      crudeProduced,
      knowledgeGained,
      score,
      grade
    };
  }, [currentStats, history]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-[150] backdrop-blur-xl">
      <div className="bg-slate-900 border-2 border-amber-500/30 w-full max-w-3xl rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.1)] flex flex-col max-h-[90vh]">
        <div className="p-8 bg-gradient-to-r from-amber-600/20 to-transparent border-b border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.3em] mb-2">{T.fiscalConclusion}</h2>
              <h1 className="text-4xl font-black text-white">{reviewData.year} {T.executiveSummary}</h1>
            </div>
            <div className="text-center bg-slate-800 p-4 rounded-2xl border border-slate-700 min-w-[100px]">
              <div className="text-xs text-slate-500 font-bold uppercase mb-1">{T.grade}</div>
              <div className={`text-5xl font-black ${reviewData.grade === 'S' ? 'text-yellow-400' : reviewData.grade === 'A' ? 'text-emerald-400' : 'text-blue-400'}`}>
                {reviewData.grade}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricBox label={T.netProfit} value={`$${reviewData.cashGrowth.toLocaleString()}`} trend={reviewData.cashGrowth >= 0 ? 'up' : 'down'} color={reviewData.cashGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <MetricBox label={T.energyTransition} value={`+${reviewData.renewableGrowth} GW`} trend={reviewData.renewableGrowth > 0 ? 'up' : 'neutral'} color="text-green-400" />
            <MetricBox label={T.pollutionReduction} value={`${reviewData.pollutionReduction > 0 ? '+' : ''}${reviewData.pollutionReduction}%`} trend={reviewData.pollutionReduction >= 0 ? 'up' : 'down'} color={reviewData.pollutionReduction >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <MetricBox label={T.knowledgeGained} value={`+${reviewData.knowledgeGained} pts`} trend={reviewData.knowledgeGained > 0 ? 'up' : 'neutral'} color="text-indigo-400" />
            <MetricBox label={T.publicTrust} value={`${reviewData.approvalChange > 0 ? '+' : ''}${reviewData.approvalChange}%`} trend={reviewData.approvalChange >= 0 ? 'up' : 'down'} color={reviewData.approvalChange >= 0 ? 'text-blue-400' : 'text-red-400'} />
            <MetricBox label={T.crudeReserves} value={`${reviewData.crudeProduced > 0 ? '+' : ''}${reviewData.crudeProduced.toLocaleString()}`} trend={reviewData.crudeProduced >= 0 ? 'up' : 'down'} color={reviewData.crudeProduced >= 0 ? 'text-amber-400' : 'text-slate-400'} />
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">{T.industrialOutput}</h3>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">{T.refinedStock}:</span>
              <span className="text-xl font-bold font-mono text-purple-400">
                {reviewData.refinedProduced > 0 ? '+' : ''}{reviewData.refinedProduced.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="text-center pt-4">
            <div className="text-xs text-slate-500 font-bold uppercase mb-2 tracking-widest">{T.performanceScore}</div>
            <div className="text-6xl font-black text-white tracking-tighter">
              {reviewData.score.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-900 border-t border-slate-800">
          <button
            onClick={() => { sounds.playSuccess(); onContinue(); }}
            className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xl rounded-2xl transition-all shadow-xl"
          >
            {T.approveContinue}
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricBox: React.FC<{ label: string; value: string; trend: 'up' | 'down' | 'neutral'; color: string }> = ({ label, value, trend, color }) => (
  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800 flex flex-col justify-between transition-all hover:bg-slate-800/50">
    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-2 truncate">{label}</span>
    <div className="flex items-end justify-between">
      <span className={`text-lg font-black ${color}`}>{value}</span>
      <span className="text-lg">{trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➖'}</span>
    </div>
  </div>
);
