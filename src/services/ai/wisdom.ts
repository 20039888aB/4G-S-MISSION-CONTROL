/** Category-tailored wisdom, quotes, and spoken motivation for the G4 Coach. */

export type WisdomCategory =
  | 'habits'
  | 'spiritual'
  | 'finance'
  | 'fitness'
  | 'learning'
  | 'gratitude'
  | 'goals'
  | 'tasks'
  | 'mindset'
  | 'best-self'
  | 'business'
  | 'review'
  | 'health';

export interface WisdomPack {
  quote: string;
  author: string;
  wisdom: string;
  motivation: string;
}

const PACKS: Record<WisdomCategory, WisdomPack[]> = {
  habits: [
    {
      quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
      author: 'Will Durant',
      wisdom:
        'A streak is not a trophy — it is proof that your future self can trust you. One kept promise today rewires identity.',
      motivation:
        'Lock in your non-negotiable habit now. Do the smallest version if you must — but do not break the chain.',
    },
    {
      quote: 'Discipline is choosing between what you want now and what you want most.',
      author: 'Abraham Lincoln (attrib.)',
      wisdom:
        'Motivation is weather. Discipline is climate. Build systems that run when feelings fade.',
      motivation:
        'Ten honest minutes beats a perfect plan you postpone. Start before your excuses finish their sentence.',
    },
    {
      quote: 'Success is the sum of small efforts repeated day in and day out.',
      author: 'Robert Collier',
      wisdom:
        'Missed days are data, not destiny. Restart without drama — consistency compounds after recovery.',
      motivation:
        'Your rhythm is waiting. Close one habit loop and feel the momentum return.',
    },
  ],
  spiritual: [
    {
      quote: 'Be still, and know that I am God.',
      author: 'Psalm 46:10',
      wisdom:
        'Prayer is not performance. It is presence. Even five quiet minutes can realign an entire day.',
      motivation:
        'Return gently. Speak honestly to God — gratitude, need, and surrender. He meets consistency more than eloquence.',
    },
    {
      quote: 'Pray without ceasing.',
      author: '1 Thessalonians 5:17',
      wisdom:
        'Spiritual rhythm anchors grinding. Without it, ambition becomes noise. With it, work becomes worship.',
      motivation:
        'Open your Bible or bow your head for one sincere prayer. Soul first — then strategy.',
    },
    {
      quote: 'Commit your work to the Lord, and your plans will be established.',
      author: 'Proverbs 16:3',
      wisdom:
        'Faith is not an escape from effort. It is the foundation under effort that refuses to quit.',
      motivation:
        'Invite God into today’s grind. Then move your hands with courage.',
    },
  ],
  finance: [
    {
      quote: 'A budget is telling your money where to go instead of wondering where it went.',
      author: 'John C. Maxwell',
      wisdom:
        'Awareness is the first compounding asset. What you track, you can train. What you ignore, owns you.',
      motivation:
        'Log every shilling this week. Clarity creates control — and control creates freedom.',
    },
    {
      quote: 'Do not save what is left after spending, but spend what is left after saving.',
      author: 'Warren Buffett',
      wisdom:
        'Surplus without a mission becomes leakage. Name a savings goal so every win has a destination.',
      motivation:
        'Pay your future self first today — even a small transfer is a declaration of destiny.',
    },
    {
      quote: 'The borrower is slave to the lender.',
      author: 'Proverbs 22:7',
      wisdom:
        'Wealth is built in quiet, boring months. Delayed dopamine is expensive wisdom bought cheaply.',
      motivation:
        'Pause one non-essential purchase and redirect it. That is how operators become free.',
    },
  ],
  fitness: [
    {
      quote: 'Take care of your body. It is the only place you have to live.',
      author: 'Jim Rohn',
      wisdom:
        'Movement is medicine for the mind. A short kept session beats a heroic plan that never starts.',
      motivation:
        'Schedule one honest session this week — walk, lift, stretch, or run — and keep the promise.',
    },
    {
      quote: 'The only bad workout is the one that did not happen.',
      author: 'Unknown',
      wisdom:
        'Your body keeps the score of your habits. Energy, focus, and mood rise when you honor training.',
      motivation:
        'Twenty minutes today. No negotiation. Your future clarity is on the other side of sweat.',
    },
    {
      quote: 'It is a shame for a man to grow old without seeing the beauty and strength of which his body is capable.',
      author: 'Socrates',
      wisdom:
        'Fitness is not vanity when it fuels vocation. Strong body, clear mind, steadfast spirit.',
      motivation:
        'Put on your shoes. Begin. The first step is the hardest — and the most holy.',
    },
  ],
  learning: [
    {
      quote: 'An investment in knowledge pays the best interest.',
      author: 'Benjamin Franklin',
      wisdom:
        'Consistency beats intensity for skill. Forty-five focused minutes daily outperforms weekend heroics.',
      motivation:
        'Block one deep-work session. Phone away. Learn like your future income depends on it — because it does.',
    },
    {
      quote: 'Live as if you were to die tomorrow. Learn as if you were to live forever.',
      author: 'Mahatma Gandhi',
      wisdom:
        'Skill is the highest ROI asset you can carry across borders, seasons, and storms.',
      motivation:
        'Open the course or book waiting for you. One chapter. One lesson. One forward inch.',
    },
    {
      quote: 'The beautiful thing about learning is that no one can take it away from you.',
      author: 'B.B. King',
      wisdom:
        'Output seals ownership. Study, then write, teach, code, or practice what you learned.',
      motivation:
        'Turn today’s study into proof — notes, drills, or a small project. Mastery loves evidence.',
    },
  ],
  gratitude: [
    {
      quote: 'Gratitude turns what we have into enough.',
      author: 'Anonymous',
      wisdom:
        'Gratitude is not soft. It is strategic optimism — it trains the mind to see provision under pressure.',
      motivation:
        'Write three specific blessings now: one person, one provision, one personal growth moment.',
    },
    {
      quote: 'Give thanks in all circumstances.',
      author: '1 Thessalonians 5:18',
      wisdom:
        'Joy grows where attention goes. Counting blessings starves anxiety of oxygen.',
      motivation:
        'Before you chase more, thank God for enough. Then grind from overflow, not emptiness.',
    },
    {
      quote: 'Wear gratitude like a cloak, and it will feed every corner of your life.',
      author: 'Rumi',
      wisdom:
        'A grateful heart becomes a resilient heart. Resilience is the hidden engine of long goals.',
      motivation:
        'Speak one thank-you out loud. Then log it. Make gratitude a daily non-negotiable.',
    },
  ],
  goals: [
    {
      quote: 'A goal properly set is halfway reached.',
      author: 'Zig Ziglar',
      wisdom:
        'Vague ambition drains energy. Clear milestones create motion. Progress loves finished loops.',
      motivation:
        'Advance your weakest goal by one milestone or one focused 25-minute block today.',
    },
    {
      quote: 'You do not rise to the level of your goals. You fall to the level of your systems.',
      author: 'James Clear',
      wisdom:
        'Goals point. Habits deliver. Link today’s tasks to the goal that matters most.',
      motivation:
        'Open your goal board. Choose one action that moves the needle before nightfall.',
    },
  ],
  tasks: [
    {
      quote: 'The secret of getting ahead is getting started.',
      author: 'Mark Twain',
      wisdom:
        'Open loops steal focus. Closing one overdue task restores more energy than scrolling ever will.',
      motivation:
        'Pick the highest-leverage open task. Start a 25-minute timer. Finish or advance it — now.',
    },
  ],
  mindset: [
    {
      quote: 'I can do all things through Christ who strengthens me.',
      author: 'Philippians 4:13',
      wisdom:
        'Low energy is a signal to shrink the plan, not abandon the mission. Rest is strategy when paired with obedience.',
      motivation:
        'Hydrate. Breathe. Pray. Then win one tiny battle. Courage returns through action.',
    },
  ],
  'best-self': [
    {
      quote: 'Small consistent actions lead to extraordinary success.',
      author: 'G4 Mission Control',
      wisdom:
        'Best-self is not a mood. It is a scoreboard of kept covenants across God, Goals, Grinding, and Gratitude.',
      motivation:
        'Protect the systems that raise your score. One prayer, one habit, one milestone — today.',
    },
  ],
  business: [
    {
      quote: 'Ideas are easy. Implementation is hard.',
      author: 'Guy Kawasaki',
      wisdom:
        'Businesses die from silence. Daily revenue actions beat weekly brainstorming.',
      motivation:
        'Message a client, ship a deliverable, or publish an offer today. Motion creates money.',
    },
  ],
  review: [
    {
      quote: 'An unexamined life is not worth living.',
      author: 'Socrates',
      wisdom:
        'Evening review closes the loop. Operators sleep in peace because they accounted for the day.',
      motivation:
        'Capture wins, blockers, and tomorrow’s number-one priority before you sleep.',
    },
  ],
  health: [
    {
      quote: 'Sleep is the best meditation.',
      author: 'Dalai Lama',
      wisdom:
        'Recovery is not weakness. Poor sleep silently taxes every pillar of your mission.',
      motivation:
        'Protect wind-down tonight. Your tomorrow’s grind is being built in tonight’s rest.',
    },
  ],
};

export function pickWisdom(
  category: string,
  seed = Date.now(),
): WisdomPack {
  const key = (category in PACKS ? category : 'mindset') as WisdomCategory;
  const list = PACKS[key] ?? PACKS.mindset;
  const pack = list[Math.abs(seed) % list.length]!;
  return pack;
}

/** Full speakable script for an insight card. */
export function buildInsightSpeech(parts: {
  title?: string;
  message: string;
  quote?: string;
  author?: string;
  wisdom?: string;
  advice?: string;
  motivation?: string;
}): string {
  const chunks = [
    parts.title ? `${parts.title}.` : '',
    parts.message,
    parts.quote ? `Wisdom for you: ${parts.quote}${parts.author ? ` — ${parts.author}` : ''}.` : '',
    parts.wisdom ?? '',
    parts.advice ? `Here is my advice. ${parts.advice}` : '',
    parts.motivation ?? '',
  ].filter(Boolean);
  return chunks.join(' ').replace(/\s+/g, ' ').trim();
}
