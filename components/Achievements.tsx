
import React from 'react';
import { Achievement, GameStats, Language } from '../types';
import { UI_STRINGS } from '../translations';

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { 
    id: 'industrial_titan', 
    title: { EN: 'Industrial Titan', ID: 'Raja Industri' }, 
    description: { 
      EN: 'Reach $10,000,000 in liquid cash reserves', 
      ID: 'Capai cadangan kas cair senilai $10.000.000' 
    }, 
    icon: '💎', 
    criteria: (s) => s.cash >= 10000000 
  },
  { 
    id: 'renewable_pioneer', 
    title: { EN: 'Renewable Pioneer', ID: 'Pelopor Terbarukan' }, 
    description: { 
      EN: 'Deploy 20 GW of renewable capacity to lead the energy transition', 
      ID: 'Operasikan 20 GW kapasitas terbarukan untuk memimpin transisi energi' 
    }, 
    icon: '🌬️', 
    criteria: (s) => s.renewableCapacity >= 20 
  },
  { 
    id: 'sustainability_giant', 
    title: { EN: 'Sustainability Giant', ID: 'Raksasa Keberlanjutan' }, 
    description: { EN: 'Reach 50 GW of renewable energy capacity', ID: 'Capai 50 GW kapasitas energi terbarukan' }, 
    icon: '♻️', 
    criteria: (s) => s.renewableCapacity >= 50 
  },
  { 
    id: 'efficiency_master', 
    title: { EN: 'Efficiency Master', ID: 'Empu Efisiensi' }, 
    description: { 
      EN: 'Optimize operations to produce 200,000 units of refined products', 
      ID: 'Optimalkan operasi untuk memproduksi 200.000 unit produk olahan' 
    }, 
    icon: '⚡', 
    criteria: (s) => s.refinedProducts >= 200000 
  },
  { 
    id: 'public_favorite', 
    title: { EN: 'Public Favorite', ID: 'Favorit Publik' }, 
    description: { 
      EN: 'Earn a legendary 95% approval rating through corporate responsibility', 
      ID: 'Raih 95% tingkat persetujuan publik melalui tanggung jawab korporat' 
    }, 
    icon: '🌟', 
    criteria: (s) => s.approval >= 95 
  },
  { 
    id: 'net_zero_hero', 
    title: { EN: 'Net Zero Hero', ID: 'Pahlawan Net-Zero' }, 
    description: { EN: '50+ GW Renewable capacity with under 5% pollution', ID: '50+ GW energi hijau dengan polusi di bawah 5%' }, 
    icon: '🌍', 
    criteria: (s) => s.renewableCapacity >= 50 && s.pollution <= 5 
  },
  { 
    id: 'green_monarch', 
    title: { EN: 'Green Monarch', ID: 'Penguasa Hijau' }, 
    description: { EN: 'Reach a massive 100 GW of renewable capacity', ID: 'Raih kapasitas energi hijau masif sebesar 100 GW' }, 
    icon: '👑', 
    criteria: (s) => s.renewableCapacity >= 100 
  },
  { 
    id: 'eco_industrialist', 
    title: { EN: 'Eco-Industrialist', ID: 'Industrialis Eko' }, 
    description: { EN: '10+ GW renewables and achieve exactly 0% pollution', ID: '10+ GW energi hijau dan capai polusi tepat 0%' }, 
    icon: '🌱', 
    criteria: (s) => s.renewableCapacity >= 10 && s.pollution === 0 
  },
  { 
    id: 'scholar', 
    title: { EN: 'Petro-Scholar', ID: 'Pakar Perminyakan' }, 
    description: { EN: 'Reach 100 points of industrial knowledge', ID: 'Raih 100 poin wawasan industri' }, 
    icon: '📚', 
    criteria: (s) => s.knowledge >= 100 
  },
  { 
    id: 'tech_visionary', 
    title: { EN: 'Tech Visionary', ID: 'Visioner Teknologi' }, 
    description: { EN: 'All industrial systems upgraded to Level 3+', ID: 'Tingkatkan semua sistem industri ke Level 3+' }, 
    icon: '🛠️', 
    criteria: (s) => Object.values(s.upgrades).every(v => v >= 3) 
  },
  { 
    id: 'master_strategist', 
    title: { EN: 'Master Strategist', ID: 'Ahli Strategi' }, 
    description: { EN: 'Guide your company successfully until the year 2035', ID: 'Pimpin perusahaan Anda dengan sukses hingga tahun 2035' }, 
    icon: '♟️', 
    criteria: (s) => s.year >= 2035 
  },
  { 
    id: 'tech_demigod', 
    title: { EN: 'Tech Demigod', ID: 'Semi-Dewa Teknologi' }, 
    description: { EN: 'All industrial systems upgraded to Level 5+', ID: 'Tingkatkan semua sistem industri ke Level 5+' }, 
    icon: '🧬', 
    criteria: (s) => Object.values(s.upgrades).every(v => v >= 5) 
  },
  { 
    id: 'treasury_overlord', 
    title: { EN: 'Treasury Overlord', ID: 'Penguasa Perbendaharaan' }, 
    description: { EN: 'Reach a legendary fortune of $100,000,000', ID: 'Raih kekayaan legendaris senilai $100.000.000' }, 
    icon: '🏦', 
    criteria: (s) => s.cash >= 100000000 
  },
  { 
    id: 'pure_skies', 
    title: { EN: 'Pure Skies', ID: 'Langit Murni' }, 
    description: { EN: 'Produce 100,000 units of refined products with 0% pollution', ID: 'Produksi 100.000 unit produk olahan dengan polusi 0%' }, 
    icon: '☁️', 
    criteria: (s) => s.refinedProducts >= 100000 && s.pollution === 0 
  },
  { 
    id: 'deep_well_master', 
    title: { EN: 'Deep Well Master', ID: 'Empu Sumur Dalam' }, 
    description: { EN: 'Upgrade Turbo Drills to Level 8', ID: 'Tingkatkan Mata Bor Turbo ke Level 8' }, 
    icon: '🕳️', 
    criteria: (s) => s.upgrades.drillLevel >= 8 
  },
  { 
    id: 'infinite_intellect', 
    title: { EN: 'Infinite Intellect', ID: 'Intelek Tak Terbatas' }, 
    description: { EN: 'Reach 500 points of industrial knowledge', ID: 'Raih 500 poin wawasan industri' }, 
    icon: '🧠', 
    criteria: (s) => s.knowledge >= 500 
  }
];

interface AchievementsProps {
  unlockedIds: string[];
  lang: Language;
}

export const Achievements: React.FC<AchievementsProps> = ({ unlockedIds, lang }) => {
  const T = UI_STRINGS[lang];
  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="text-yellow-500">🏆</span> {T.milestones}
        </h3>
        <span className="text-xs font-mono text-slate-500">
          {unlockedIds.length} / {ACHIEVEMENTS_LIST.length} {T.unlocked}
        </span>
      </div>
      
      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
        {ACHIEVEMENTS_LIST.map((ach) => {
          const isUnlocked = unlockedIds.includes(ach.id);
          return (
            <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all duration-500 ${isUnlocked ? 'bg-amber-500/10 border-amber-500/50 scale-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-slate-800/40 border-slate-700/50 grayscale opacity-40 scale-95'}`}>
              <div className="text-2xl">{ach.icon}</div>
              <div className="min-w-0">
                <h4 className={`text-sm font-bold truncate ${isUnlocked ? 'text-amber-400' : 'text-slate-400'}`}>{ach.title[lang]}</h4>
                <p className="text-[10px] text-slate-500 leading-tight">{ach.description[lang]}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
