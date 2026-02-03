
import { NewsEvent, QuizQuestion, GameStats, Language } from "./types.ts";

const QUESTIONS: Record<Language, { Easy: QuizQuestion[], Medium: QuizQuestion[], Hard: QuizQuestion[] }> = {
  EN: {
    Easy: [
      {
        question: "What is petroleum mainly used for?",
        options: ["Making paper", "Fuel and energy source", "Growing plants", "Producing oxygen"],
        correctIndex: 1,
        explanation: "Petroleum is the primary source for gasoline, diesel, and jet fuel, powering the global transportation and energy sectors.",
        difficulty: 'Easy'
      },
      {
        question: "Petroleum was formed from...",
        options: ["Rocks and sand", "Volcano lava", "Ancient plants and animals", "Freshwater algae only"],
        correctIndex: 2,
        explanation: "Petroleum (crude oil) is a fossil fuel created from the decomposed remains of ancient marine organisms buried under sediment.",
        difficulty: 'Easy'
      }
    ],
    Medium: [
      {
        question: "Why is petroleum usually found deep underground?",
        options: ["It flows down from rivers", "It was trapped under layers of rock over millions of years", "Humans put it there", "It is produced by underground plants"],
        correctIndex: 1,
        explanation: "Geological movement and sedimentation trap organic matter deep in the earth, which then converts to oil over millions of years.",
        difficulty: 'Medium'
      }
    ],
    Hard: [
      {
        question: "Based on the text, why is petroleum classified as a non-renewable resource?",
        options: ["Because it is expensive to extract", "Because it causes pollution", "Because it takes millions of years to form", "Because it is found underground"],
        correctIndex: 2,
        explanation: "Petroleum is non-renewable because it needs millions of years to form and cannot be replaced at the same rate it is used.",
        difficulty: 'Hard'
      }
    ]
  },
  ID: {
    Easy: [
      {
        question: "Apa kegunaan utama dari minyak bumi?",
        options: ["Bahan pembuat kertas", "Sumber bahan bakar dan energi", "Pupuk tanaman hias", "Menghasilkan oksigen"],
        correctIndex: 1,
        explanation: "Minyak bumi adalah sumber utama bensin, diesel, dan bahan bakar jet yang menggerakkan sektor transportasi dunia.",
        difficulty: 'Easy'
      },
      {
        question: "Minyak bumi secara alami terbentuk dari...",
        options: ["Batuan meteorit", "Lava gunung berapi", "Sisa organisme laut purba", "Alga air tawar saja"],
        correctIndex: 2,
        explanation: "Minyak bumi adalah bahan bakar fosil yang terbentuk dari dekomposisi sisa organisme laut yang terkubur selama jutaan tahun.",
        difficulty: 'Easy'
      }
    ],
    Medium: [
      {
        question: "Mengapa minyak bumi biasanya ditemukan jauh di dalam kerak bumi?",
        options: ["Mengalir turun dari permukaan sungai", "Terjebak di bawah lapisan sedimen selama jutaan tahun", "Sengaja diletakkan oleh manusia", "Dihasilkan oleh akar pohon"],
        correctIndex: 1,
        explanation: "Tekanan dan panas di kedalaman bumi selama jutaan tahun mengubah materi organik menjadi rantai hidrokarbon yang kita kenal sebagai minyak.",
        difficulty: 'Medium'
      }
    ],
    Hard: [
      {
        question: "Berdasarkan prinsip geologi, mengapa minyak bumi diklasifikasikan sebagai sumber daya tak terbarukan?",
        options: ["Biaya ekstraksinya sangat mahal", "Menyebabkan polusi udara", "Proses pembentukannya memakan waktu jutaan tahun", "Jumlahnya terbatas di dalam tanah"],
        correctIndex: 2,
        explanation: "Minyak bumi tidak bisa digantikan secepat kita mengonsumsinya karena alam butuh waktu jutaan tahun untuk membentuknya kembali.",
        difficulty: 'Hard'
      }
    ]
  }
};

const EVENTS: Record<Language, NewsEvent[]> = {
  EN: [
    {
      title: "Global Supply Chain Disruption",
      description: "Political instability in major oil-producing regions has caused a sudden spike in crude oil demand and prices.",
      impact: { stat: "cash", value: -50000 },
      options: [
        { label: "Increase local production", impact: { crudeOil: 20000, pollution: 5 } },
        { label: "Invest in stockpiles", impact: { cash: -100000, crudeOil: 50000 } }
      ]
    },
    {
      title: "New Environmental Regulation",
      description: "The Global Green Initiative has passed stricter emissions laws. Your current facilities may need upgrades.",
      impact: { stat: "approval", value: -10 },
      options: [
        { label: "Upgrade filtration systems", impact: { cash: -150000, pollution: -10, approval: 10 } },
        { label: "Lobby against the bill", impact: { cash: -50000, approval: -5 } }
      ]
    }
  ],
  ID: [
    {
      title: "Gangguan Rantai Pasok Global",
      description: "Ketidakstabilan geopolitik di wilayah penghasil minyak utama memicu lonjakan harga dan permintaan minyak mentah dunia secara mendadak.",
      impact: { stat: "cash", value: -50000 },
      options: [
        { label: "Tingkatkan kapasitas produksi", impact: { crudeOil: 20000, pollution: 5 } },
        { label: "Investasi pada cadangan strategis", impact: { cash: -100000, crudeOil: 50000 } }
      ]
    },
    {
      title: "Regulasi Emisi Lingkungan Baru",
      description: "Pemerintah menetapkan aturan emisi yang lebih ketat. Fasilitas pengilangan Anda memerlukan pembaruan teknologi untuk tetap beroperasi.",
      impact: { stat: "approval", value: -10 },
      options: [
        { label: "Perbarui sistem filtrasi emisi", impact: { cash: -150000, pollution: -10, approval: 10 } },
        { label: "Ajukan keberatan melalui lobi", impact: { cash: -50000, approval: -5 } }
      ]
    }
  ]
};

export async function generateNewsEvent(stats: GameStats): Promise<NewsEvent> {
  const pool = EVENTS[stats.language] || EVENTS.EN;
  const randomEvent = pool[Math.floor(Math.random() * pool.length)];
  return Promise.resolve({ ...randomEvent });
}

export async function generateQuiz(knowledgeLevel: number, lang: Language): Promise<QuizQuestion> {
  const langPool = QUESTIONS[lang] || QUESTIONS.EN;
  let selectedPool = langPool.Easy;
  if (knowledgeLevel >= 120) {
    selectedPool = langPool.Hard;
  } else if (knowledgeLevel >= 40) {
    selectedPool = langPool.Medium;
  }

  const randomQuestion = selectedPool[Math.floor(Math.random() * selectedPool.length)];
  return Promise.resolve({ ...randomQuestion });
}
