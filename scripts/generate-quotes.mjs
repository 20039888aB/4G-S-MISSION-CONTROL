import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('src/data/quotes');
fs.mkdirSync(outDir, { recursive: true });

const slots = [
  'late_night',
  'dawn',
  'early_morning',
  'morning',
  'midday',
  'afternoon',
  'evening',
  'night',
];
const pillars = ['god', 'goals', 'grinding', 'gratitude'];

const cores = [
  ['Commit your work to the Lord, and your plans will be established.', 'Proverbs 16:3', 'god'],
  ['Be still, and know that I am God.', 'Psalm 46:10', 'god'],
  ['I can do all things through Christ who strengthens me.', 'Philippians 4:13', 'god'],
  ['Trust in the Lord with all your heart.', 'Proverbs 3:5', 'god'],
  ['The Lord is my shepherd; I shall not want.', 'Psalm 23:1', 'god'],
  ['Pray without ceasing.', '1 Thessalonians 5:17', 'god'],
  ['Faith is the substance of things hoped for.', 'Hebrews 11:1', 'god'],
  ['Ask, and it will be given to you; seek, and you will find.', 'Matthew 7:7', 'god'],
  ['This is the day that the Lord has made; let us rejoice.', 'Psalm 118:24', 'god'],
  ['Cast all your anxiety on Him because He cares for you.', '1 Peter 5:7', 'god'],
  ['Be strong and courageous. Do not be afraid.', 'Joshua 1:9', 'god'],
  ['Let your light shine before others.', 'Matthew 5:16', 'god'],
  ['The joy of the Lord is your strength.', 'Nehemiah 8:10', 'god'],
  ['Walk by faith, not by sight.', '2 Corinthians 5:7', 'god'],
  ['In all your ways acknowledge Him, and He will make straight your paths.', 'Proverbs 3:6', 'god'],
  ['God has not given us a spirit of fear.', '2 Timothy 1:7', 'god'],
  ['Whatever you do, work heartily, as for the Lord.', 'Colossians 3:23', 'god'],
  ['The name of the Lord is a strong tower.', 'Proverbs 18:10', 'god'],
  ['Blessed is the one who trusts in the Lord.', 'Jeremiah 17:7', 'god'],
  ['His mercies are new every morning.', 'Lamentations 3:23', 'god'],
  ['A goal without a plan is just a wish.', 'Antoine de Saint-Exupéry', 'goals'],
  ['You do not rise to the level of your goals. You fall to the level of your systems.', 'James Clear', 'goals'],
  ['Set your goals high, and do not stop until you get there.', 'Bo Jackson', 'goals'],
  ['What gets measured gets managed.', 'Peter Drucker', 'goals'],
  ['Begin with the end in mind.', 'Stephen Covey', 'goals'],
  ['Dream big. Start small. Act now.', 'Robin Sharma', 'goals'],
  ['A year from now you will wish you had started today.', 'Karen Lamb', 'goals'],
  ['Clarity precedes success.', 'Robin Sharma', 'goals'],
  ['Goals are dreams with deadlines.', 'Napoleon Hill', 'goals'],
  ['If you want to live a happy life, tie it to a goal.', 'Albert Einstein', 'goals'],
  ['Intention without action is just a wish in nicer clothes.', 'G4 Mission Control', 'goals'],
  ['Write the vision and make it plain.', 'Habakkuk 2:2', 'goals'],
  ['Aim at nothing and you will hit it every time.', 'Zig Ziglar', 'goals'],
  ['Progress is impossible without change.', 'George Bernard Shaw', 'goals'],
  ['Your future is created by what you do today, not tomorrow.', 'Robert Kiyosaki', 'goals'],
  ['Discipline is the bridge between goals and accomplishment.', 'Jim Rohn', 'grinding'],
  ['The secret of getting ahead is getting started.', 'Mark Twain', 'grinding'],
  ['We are what we repeatedly do. Excellence, then, is not an act, but a habit.', 'Will Durant', 'grinding'],
  ['Motivation gets you going. Discipline keeps you growing.', 'John C. Maxwell', 'grinding'],
  ['Do something today that your future self will thank you for.', 'Sean Patrick Flanery', 'grinding'],
  ['Hard work beats talent when talent does not work hard.', 'Tim Notke', 'grinding'],
  ['Success is the sum of small efforts repeated day in and day out.', 'Robert Collier', 'grinding'],
  ['Pain is temporary. Quitting lasts forever.', 'Lance Armstrong', 'grinding'],
  ['The only bad workout is the one that did not happen.', 'Unknown', 'grinding'],
  ['Wake up with determination. Go to bed with satisfaction.', 'Unknown', 'grinding'],
  ['Starve your distractions. Feed your focus.', 'Unknown', 'grinding'],
  ['Consistency compounds. Excuses evaporate.', 'G4 Mission Control', 'grinding'],
  ['The grind does not care how you feel. Show up anyway.', 'G4 Mission Control', 'grinding'],
  ['Small consistent actions lead to extraordinary success.', 'G4 Mission Control', 'grinding'],
  ['It always seems impossible until it is done.', 'Nelson Mandela', 'grinding'],
  ['Do not watch the clock; do what it does. Keep going.', 'Sam Levenson', 'grinding'],
  ['The way to get started is to quit talking and begin doing.', 'Walt Disney', 'grinding'],
  ['Fall seven times, stand up eight.', 'Japanese Proverb', 'grinding'],
  ['Champions keep playing until they get it right.', 'Billie Jean King', 'grinding'],
  ['Sweat more in training, bleed less in battle.', 'Unknown', 'grinding'],
  ['Gratitude turns what we have into enough.', 'Anonymous', 'gratitude'],
  ['Wear gratitude like a cloak, and it will feed every corner of your life.', 'Rumi', 'gratitude'],
  ['Gratitude is the healthiest of all human emotions.', 'Zig Ziglar', 'gratitude'],
  ['Give thanks in all circumstances.', '1 Thessalonians 5:18', 'gratitude'],
  ['Enjoy the little things, for one day you may look back and realize they were the big things.', 'Robert Brault', 'gratitude'],
  ['Gratitude makes sense of our past, brings peace for today, and creates a vision for tomorrow.', 'Melody Beattie', 'gratitude'],
  ['When I started counting my blessings, my whole life turned around.', 'Willie Nelson', 'gratitude'],
  ['A grateful heart is a magnet for miracles.', 'Unknown', 'gratitude'],
  ['Gratitude is not only the greatest of virtues, but the parent of all others.', 'Cicero', 'gratitude'],
  ['Silent gratitude is not much use to anyone.', 'G.B. Stern', 'gratitude'],
  ['Count blessings, not problems.', 'Unknown', 'gratitude'],
  ['Joy is the simplest form of gratitude.', 'Karl Barth', 'gratitude'],
];

const timeHooks = {
  late_night: [
    'Even in the quiet hours, your future is being built.',
    'Late nights reveal who is serious about the mission.',
    'While the world sleeps, visionaries refine the plan.',
    'Protect your rest, but honor the holy hours of deep work.',
    'The night is not wasted when it is invested in purpose.',
    'Deep work after midnight still counts as devotion to the craft.',
    'If you are awake, make it count for God, goals, grinding, or gratitude.',
  ],
  dawn: [
    'Dawn rewards those who refuse to hit snooze on destiny.',
    'The first light belongs to the disciplined.',
    'Rise before excuses. The day is already listening.',
    'At dawn, faith and focus meet on the battlefield of habit.',
    'Start before the noise. Win before the crowd wakes.',
    '4:30 is not early when purpose is loud.',
    'Dawn is proof that mercies really are new.',
  ],
  early_morning: [
    'Good morning — your early promise still stands.',
    'Morning is a clean page. Write discipline first.',
    'Begin with prayer, then motion. Soul first, then sweat.',
    'A powerful morning creates an unstoppable day.',
    'Greet the day like a mission briefing, not a burden.',
    'Good morning. Water, word, workout — in some holy order.',
    'Early morning courage is quieter, and stronger.',
  ],
  morning: [
    'Good morning. Momentum loves an early decision.',
    'Own the morning and the afternoon will negotiate.',
    'Today is another chance to honor the 4 Gs.',
    'Put first things first while energy is high.',
    'Morning clarity beats evening regret.',
    'Good morning — choose the hard right over the easy wrong.',
    'The morning belongs to builders, not browsers.',
  ],
  midday: [
    'Midday check: are you still aligned with the mission?',
    'Reset at noon. Refocus. Recommit.',
    'The middle of the day is where consistency is proven.',
    'Hydrate, pray briefly, then finish strong.',
    'Do not let lunch steal your standards.',
    'Midday is a second morning if you choose it.',
    'Pause. Breathe. Then return sharper.',
  ],
  afternoon: [
    'Good afternoon — protect the second wind.',
    'Afternoons belong to finishers, not starters only.',
    'Push through the dip. That is where growth hides.',
    'Stay sharp. Distraction peaks when discipline softens.',
    'One focused hour now beats three scattered ones later.',
    'Good afternoon. Close loops before the day closes you.',
    'The afternoon grind separates talkers from operators.',
  ],
  evening: [
    'Good evening. Review the wins before the worries.',
    'Close the day with gratitude and honest reflection.',
    'Evening is for accounting: what did you grind for?',
    'Prepare tomorrow tonight. Future-you is watching.',
    'Rest is part of the strategy, not an interruption.',
    'Good evening — count three blessings before complaints.',
    'Let the evening restore what the day demanded.',
  ],
  night: [
    'Good night to guilt. Good night to almost. Sleep in peace.',
    'Lay down the phone. Lift up a prayer. Recover well.',
    'Night seals the ledger of the day — make it honorable.',
    'Restore the body so the mission can continue.',
    'End with thankfulness. Begin again at dawn.',
    'Good night. Tomorrow needs a rested warrior.',
    'Sleep is training for tomorrow\'s obedience.',
  ],
};

const prefixes = {
  late_night: ['In the late hours:', 'Night note:', 'Quiet-hour truth:', 'After midnight:'],
  dawn: ['At dawn:', 'First light:', 'Dawn briefing:', 'Before sunrise:'],
  early_morning: ['Good morning:', 'Early call:', 'Sunrise standard:', 'AM courage:'],
  morning: ['Morning focus:', 'Good morning reminder:', 'AM mission:', 'Morning lock-in:'],
  midday: ['Midday pulse:', 'Noon reset:', 'Midday truth:', 'Midday mission:'],
  afternoon: ['Afternoon push:', 'PM standard:', 'Good afternoon:', 'Afternoon grit:'],
  evening: ['Evening review:', 'Good evening:', 'Sunset note:', 'Evening seal:'],
  night: ['Night seal:', 'Before you sleep:', 'Good night wisdom:', 'Lights-out truth:'],
};

const openers = [
  'Remember:',
  'Hold this:',
  'Lock this in:',
  'Carry this:',
  'Live this:',
  'Anchor here:',
  'Mission note:',
  'Truth for now:',
  'Stay with this:',
  'Let this lead you:',
];

const closers = [
  'Keep going.',
  'Stay faithful.',
  'Execute.',
  'Be grateful.',
  'Do the work.',
  'Trust the process.',
  'Honor the 4 Gs.',
  'One more rep.',
  'One more prayer.',
  'One more page.',
];

const gritLines = [
  'Discipline today is freedom tomorrow.',
  'Your standards are your strategy.',
  'Boring consistency beats flashy intensity.',
  'Show up when motivation clocks out.',
  'Build the life that matches your prayers.',
  'Protect your focus like sacred ground.',
  'Money follows mastery. Mastery follows reps.',
  'Health is the first business asset.',
  'Learning is a weapon — stay sharp.',
  'Relationships grow when you grow.',
  'Trade comfort for character.',
  'Finish what you started this morning.',
  'Your calendar reveals your real priorities.',
  'Energy management is wealth management.',
  'Silence the noise. Amplify the mission.',
  'Be the adult your younger self needed.',
  'Progress loves proof, not promises.',
  'The body keeps the score of your habits.',
  'Spiritual strength fuels physical grit.',
  'Gratitude turns pressure into purpose.',
  'Code, study, train, pray — then repeat.',
  'Savings are future options purchased today.',
  'A clean room and a clear mind start the same way.',
  'Do not negotiate with the alarm.',
  'Win the next 25 minutes.',
  'Identity is built in private hours.',
  'Excellence is a decision made daily.',
  'Delay the dopamine. Deliver the work.',
  'Your goals require your calendar, not just your vision board.',
  'Be hard to interrupt and easy to trust.',
  'Pray first, then plan, then push.',
  'Track the habit until the habit tracks you.',
  'Wealth is built in quiet, boring months.',
  'Your body is the temple where discipline worships.',
  'Read one chapter. Write one page. Lift one set.',
  'Stop refreshing the feed. Start refreshing your craft.',
  'Courage is a muscle. Train it in small reps.',
  'The market rewards those who stayed when it was dull.',
  'Kindness and grit can live in the same heart.',
  'Become someone your goals are proud of.',
];

const weekdayHooks = {
  0: 'Sunday: rest well, review honestly, prepare the week.',
  1: 'Monday: set the tone the rest of the week will copy.',
  2: 'Tuesday: keep the promise you made yesterday.',
  3: 'Wednesday: midweek is for recommitment, not retreat.',
  4: 'Thursday: finish lines are closer than they feel.',
  5: 'Friday: close strong; do not leak excellence.',
  6: 'Saturday: build, recover, and sharpen the blade.',
};

const authors = [
  'G4 Mission Control',
  'Unknown',
  'Ancient Wisdom',
  'Discipline Archives',
  'Mission Notes',
];

const quotes = [];
const seen = new Set();

function pillarForText(line, fallback = 'grinding') {
  const l = line.toLowerCase();
  if (
    l.includes('pray') ||
    l.includes('faith') ||
    l.includes('lord') ||
    l.includes('christ') ||
    l.includes('god') ||
    l.includes('psalm') ||
    l.includes('merc')
  ) {
    return 'god';
  }
  if (l.includes('grat') || l.includes('thank') || l.includes('bless') || l.includes('joy')) {
    return 'gratitude';
  }
  if (l.includes('goal') || l.includes('plan') || l.includes('vision') || l.includes('dream')) {
    return 'goals';
  }
  return fallback;
}

function add(text, author, pillar, slotList, tags) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const key = cleaned.toLowerCase();
  if (seen.has(key) || cleaned.length < 12) return false;
  seen.add(key);
  quotes.push({
    text: cleaned,
    author,
    pillar,
    slots: slotList,
    tags,
  });
  return true;
}

for (const [text, author, pillar] of cores) {
  add(text, author, pillar, ['any'], [pillar, 'core']);
}

for (const slot of slots) {
  for (const line of timeHooks[slot]) {
    add(line, 'G4 Mission Control', pillarForText(line), [slot], [slot, 'time']);
  }
}

for (const [day, line] of Object.entries(weekdayHooks)) {
  add(line, 'G4 Mission Control', 'goals', ['any'], ['weekday', `dow-${day}`]);
}

// Build evenly across slots so every day-part has depth.
const TARGET = 1000;
const perSlot = Math.ceil(TARGET / slots.length);

for (const slot of slots) {
  let guard = 0;
  let i = 0;
  while (quotes.filter((q) => q.slots.includes(slot)).length < perSlot && guard < 5000) {
    const opener = openers[i % openers.length];
    const grit = gritLines[i % gritLines.length];
    const closer = closers[i % closers.length];
    const pillar = pillars[i % pillars.length];
    const author = authors[i % authors.length];
    const pref = prefixes[slot][i % prefixes[slot].length];
    const core = cores[i % cores.length];
    const variants = [
      `${pref} ${core[0]}`,
      `${opener} ${grit}`,
      `${grit} ${closer}`,
      `${pref} ${grit}`,
      `${opener} ${grit} ${closer}`,
      `${pref} ${opener} ${grit}`,
      `${pref} ${grit} ${closer}`,
      `For ${slot.replaceAll('_', ' ')}: ${grit}`,
      `${pref} Stay locked on ${pillar}. ${grit}`,
      `Mission ${slot.replaceAll('_', ' ')} #${i + 1}: ${grit}`,
    ];
    for (const v of variants) {
      add(v, i % 2 === 0 ? author : core[1], pillar, [slot], [slot, pillar, 'generated']);
    }
    i += 1;
    guard += 1;
  }
}

// Universal "any" quotes for fallback
for (const [text, author, pillar] of cores) {
  add(`Always: ${text}`, author, pillar, ['any'], [pillar, 'any']);
}

const out = quotes.slice(0, Math.max(TARGET, quotes.length)).slice(0, 1100).map((q, idx) => ({
  id: `quote-${String(idx).padStart(4, '0')}`,
  ...q,
}));

fs.writeFileSync(path.join(outDir, 'catalog.json'), JSON.stringify(out));
console.log(JSON.stringify({ count: out.length, unique: seen.size }, null, 2));
