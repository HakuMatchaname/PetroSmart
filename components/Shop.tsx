
import React from 'react';
import { Upgrades, Language } from '../types.ts';
import { sounds } from '../soundUtils.ts';
import { UI_STRINGS } from '../translations.ts';

interface UpgradeDefinition {
  id: keyof Upgrades;
  title: Record<Language, string>;
  icon: string;
  description: Record<Language, string>;
  baseCost: number;
  pros: string;
  cons: string;
}

const MAX_VISUAL_LEVEL = 5;

const UPGRADE_DEFS: UpgradeDefinition[] = [
  {
    id: 'drillLevel',
    title: { EN: 'Turbo Drills', ID: 'Mata Bor Turbo' },
    icon: '🏗️',
    description: { 
      EN: 'Higher output via high-pressure cavitation.', 
      ID: 'Output ekstraksi lebih tinggi melalui teknologi kavitasi tekanan tinggi.' 
    },
    baseCost: 250000,
    pros: '+15k Crude',
    cons: '+1 Pollute'
  },
  {
    id: 'refineLevel',
    title: { EN: 'Nano-Catalysts', ID: 'Katalis-Nano' },
    icon: '🔥',
    description: { 
      EN: 'Molecular precision in the cracking tower.', 
      ID: 'Presisi molekuler pada menara distilasi untuk efisiensi pengolahan.' 
    },
    baseCost: 300000,
    pros: '+$50k Rev',
    cons: '+2 Pollute'
  },
  {
    id: 'researchLevel',
    title: { EN: 'AI Lab Cluster', ID: 'Klaster Lab AI' },
    icon: '🧪',
    description: { 
      EN: 'Quantum simulations for energy storage.', 
      ID: 'Simulasi kuantum untuk optimalisasi penyimpanan dan riset energi masa depan.' 
    },
    baseCost: 200000,
    pros: '+5 Know',
    cons: '+15% Drill Cost'
  },
  {
    id: 'renewableLevel',
    title: { EN: 'Smart Grid 2.0', ID: 'Grid Pintar 2.0' },
    icon: '🌬️',
    description: { 
      EN: 'Efficient distribution of green power.', 
      ID: 'Distribusi energi terbarukan yang lebih efisien ke seluruh jaringan nasional.' 
    },
    baseCost: 400000,
    pros: '+2 GW',
    cons: '+20% Maint'
  }
];

interface ShopProps {
  upgrades: Upgrades;
  currentCash: number;
  onPurchase: (id: keyof Upgrades, cost: number) => void;
  lang: Language;
}

export const Shop: React.FC<ShopProps> = ({ upgrades, currentCash, onPurchase, lang }) => {
  const T = UI_STRINGS[lang];
  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <span className="text-emerald-500">🏬</span> {T.techShop}
      </h3>
      
      <div className="space-y-4">
        {UPGRADE_DEFS.map((def) => {
          const level = upgrades[def.id];
          const cost = Math.floor(def.baseCost * 1.5 * Math.pow(2.4, level));
          const canAfford = currentCash >= cost;

          return (
            <div key={def.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all group">
              <div className="flex gap-3 mb-3">
                <div className="text-2xl bg-slate-900 w-12 h-12 flex items-center justify-center rounded-xl border border-slate-700">
                  {def.icon}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {def.title[lang]} <span className="text-[10px] text-amber-500">LVL {level}</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-tight">{def.description[lang]}</p>
                </div>
              </div>

              <div className="mb-4 space-y-1">
                <div className="flex justify-between text-[9px] font-black text-slate-600 uppercase">
                  <span>{T.investmentProgress}</span>
                  <span>{Math.min(level, MAX_VISUAL_LEVEL)} / {MAX_VISUAL_LEVEL}</span>
                </div>
                <div className="flex gap-1 h-1.5">
                  {[...Array(MAX_VISUAL_LEVEL)].map((_, i) => (
                    <div key={i} className={`flex-1 rounded-full ${i < level ? 'bg-amber-500' : 'bg-slate-700'}`} />
                  ))}
                </div>
              </div>

              <button
                disabled={!canAfford}
                onClick={() => onPurchase(def.id, cost)}
                className={`w-full py-2 rounded-xl font-black text-[10px] uppercase ${canAfford ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-slate-600 border border-slate-700 opacity-50'}`}
              >
                {canAfford ? `${T.upgrade} $${(cost / 1000).toFixed(0)}k` : `${T.need} $${(cost / 1000).toFixed(0)}k`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
