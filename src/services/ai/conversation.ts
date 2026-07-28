import {
  buildDailyMissionPlan,
  generateInsights,
  scoreLife,
} from '@/services/ai/coach';
import type {
  CoachIntent,
  CoachReply,
  DataSnapshot,
} from '@/services/ai/types';
import { pickWisdom } from '@/services/ai/wisdom';

function withWisdom(category: string, body: string, seed = 1): string {
  const pack = pickWisdom(category, seed + body.length);
  return [
    body,
    '',
    `“${pack.quote}” — ${pack.author}`,
    '',
    pack.wisdom,
    '',
    pack.motivation,
  ].join('\n');
}

const INTENT_RULES: Array<{ intent: CoachIntent; patterns: RegExp[] }> = [
  {
    intent: 'greeting',
    patterns: [/^(hi|hello|hey|yo|good\s*(morning|afternoon|evening))\b/i],
  },
  {
    intent: 'today_plan',
    patterns: [
      /\b(today|plan|what should i do|focus|priority|mission)\b/i,
      /\bwhere (do|should) i start\b/i,
    ],
  },
  {
    intent: 'habits',
    patterns: [/\b(habit|streak|discipline|consistency|routine)\b/i],
  },
  {
    intent: 'goals',
    patterns: [/\b(goal|milestone|vision|progress|dream|target)\b/i],
  },
  {
    intent: 'finance',
    patterns: [
      /\b(money|finance|budget|spend|saving|net worth|income|expense|debt)\b/i,
    ],
  },
  {
    intent: 'health',
    patterns: [
      /\b(health|sleep|workout|gym|weight|energy|tired|fitness|run)\b/i,
    ],
  },
  {
    intent: 'spiritual',
    patterns: [
      /\b(pray|prayer|bible|god|faith|spiritual|church|scripture|devotion)\b/i,
    ],
  },
  {
    intent: 'gratitude',
    patterns: [/\b(gratitude|grateful|thankful|blessing|mindset|joy)\b/i],
  },
  {
    intent: 'learning',
    patterns: [/\b(learn|study|course|book|skill|read|trading|code)\b/i],
  },
  {
    intent: 'business',
    patterns: [/\b(business|client|revenue|hustle|offer|project)\b/i],
  },
  {
    intent: 'motivation',
    patterns: [
      /\b(motivat|inspire|encourage|push me|keep going|fire)\b/i,
    ],
  },
  {
    intent: 'stuck',
    patterns: [
      /\b(stuck|overwhelm|procrastinat|lazy|lost|anxious|stress|can't|cannot)\b/i,
    ],
  },
  {
    intent: 'best_self',
    patterns: [
      /\b(best self|become|identity|who i am|level up|transform)\b/i,
    ],
  },
  {
    intent: 'review',
    patterns: [/\b(review|reflect|weekly|check.?in|how am i doing|score)\b/i],
  },
  {
    intent: 'help',
    patterns: [/\b(help|what can you do|commands|options)\b/i],
  },
];

export function detectIntent(input: string): CoachIntent {
  const text = input.trim();
  if (!text) return 'greeting';
  for (const rule of INTENT_RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.intent;
  }
  return 'general';
}

function followUpsFor(intent: CoachIntent): string[] {
  const map: Record<CoachIntent, string[]> = {
    greeting: [
      'What should I focus on today?',
      'How am I doing overall?',
      'Help me with my goals',
    ],
    today_plan: [
      'Break down my top goal',
      'How are my habits?',
      'Give me motivation',
    ],
    habits: [
      'What should I focus on today?',
      'I feel stuck',
      'Spiritual check-in',
    ],
    goals: [
      'What should I focus on today?',
      'Help with money',
      'I feel stuck',
    ],
    finance: [
      'How am I doing overall?',
      'Wishlist progress?',
      'What should I focus on today?',
    ],
    health: [
      'What should I focus on today?',
      'I feel low energy',
      'Habits check',
    ],
    spiritual: [
      'Gratitude prompt',
      'What should I focus on today?',
      'Best-self advice',
    ],
    gratitude: [
      'Spiritual check-in',
      'Give me motivation',
      'Daily plan',
    ],
    learning: [
      'Help with goals',
      'What should I focus on today?',
      'Business advice',
    ],
    business: [
      'Money check',
      'What should I focus on today?',
      'Help with goals',
    ],
    motivation: [
      'What should I focus on today?',
      'I feel stuck',
      'Best-self advice',
    ],
    stuck: [
      'Give me a tiny plan',
      'Motivate me',
      'How are my habits?',
    ],
    best_self: [
      'What should I focus on today?',
      'How am I doing overall?',
      'Spiritual check-in',
    ],
    review: [
      'What should I focus on today?',
      'Help with goals',
      'Motivate me',
    ],
    help: [
      'What should I focus on today?',
      'How am I doing overall?',
      'Best-self advice',
    ],
    general: [
      'What should I focus on today?',
      'How am I doing overall?',
      'Help with my goals',
    ],
  };
  return map[intent];
}

/** Interactive, progress-aware coach reply (local, no cloud). */
export function replyAsCoach(
  userText: string,
  snapshot: DataSnapshot,
): CoachReply {
  const intent = detectIntent(userText);
  const insights = generateInsights(snapshot);
  const plan = buildDailyMissionPlan(snapshot);
  const score = scoreLife(snapshot);
  const name = snapshot.displayName;

  const baseFollowUps = followUpsFor(intent);

  switch (intent) {
    case 'greeting':
      return {
        intent,
        message: `${snapshot.greeting}, ${name}. I'm your G4 Coach — locked on God, Goals, Grinding, and Gratitude.\n\nBest-Self Score: **${score}/100** (${snapshot.timeLabel}).\nHabits today: **${snapshot.habitsCompletedToday}/${snapshot.habitsTargetToday}**.\n\nAsk me anything about your progress, or say “What should I focus on today?”`,
        actions: [
          { label: 'Today’s plan', href: '/ai-coach' },
          { label: 'Habits', href: '/habits' },
          { label: 'Daily Review', href: '/review' },
        ],
        followUps: baseFollowUps,
        insights: insights.slice(0, 3),
      };

    case 'today_plan':
      return {
        intent,
        message: [
          `${name}, here’s your **${snapshot.timeLabel} mission plan**:`,
          '',
          ...plan.map((step, i) => `${i + 1}. ${step}`),
          '',
          snapshot.goals[0]
            ? `North star: “${snapshot.goals[0].title}” at ${snapshot.goals[0].progress}%. Move it one inch today.`
            : 'Set one active goal so every grind has a destination.',
          '',
          'Execute the first item in the next 10 minutes. Speed creates clarity.',
        ].join('\n'),
        actions: [
          { label: 'Habits', href: '/habits' },
          { label: 'Tasks', href: '/tasks' },
          { label: 'Goals', href: '/goals' },
        ],
        followUps: baseFollowUps,
      };

    case 'habits': {
      const gaps = snapshot.habitGaps
        .slice(0, 4)
        .map((h) => `• ${h.name} (streak ${h.streak})`)
        .join('\n');
      return {
        intent,
        message: withWisdom(
          'habits',
          [
            `Discipline check: **${snapshot.habitsCompletedToday}/${snapshot.habitsTargetToday}** complete. Max streak: **${snapshot.habitStreakMax}** days.`,
            '',
            gaps
              ? `Still open today:\n${gaps}\n\nAdvice: close the easiest open habit first — momentum is a chain reaction.`
              : 'All tracked habits are complete. That’s elite. Protect recovery so tomorrow stays sharp.',
          ].join('\n'),
          snapshot.habitStreakMax + 3,
        ),
        actions: [{ label: 'Open Habits', href: '/habits' }],
        followUps: baseFollowUps,
      };
    }

    case 'goals': {
      if (snapshot.goals.length === 0) {
        return {
          intent,
          message: `You don’t have an active goal yet, ${name}. Best selves aim at something concrete.\n\nCreate one 90-day goal under Goals — faith, fitness, finance, skill, or business — then tap “Worked today” after each focused block.`,
          actions: [{ label: 'Create goal', href: '/goals' }],
          followUps: baseFollowUps,
        };
      }
      const lines = snapshot.goals
        .slice(0, 5)
        .map((g) => {
          const todayTag = g.workedToday ? ' · ✓ today' : '';
          const weekTag =
            g.weekDaysWorked != null
              ? ` · ${g.weekDaysWorked}/7 days`
              : '';
          return `• **${g.title}** — ${g.progress}%${weekTag}${todayTag}${
            g.openMilestones ? ` · ${g.openMilestones} open milestones` : ''
          }`;
        })
        .join('\n');
      const weakest = snapshot.goals[0]!;
      const week = snapshot.goalWeek;
      return {
        intent,
        message: [
          `Goal board (${snapshot.goals.length} active · ${snapshot.goalsCompleted} completed lifetime):`,
          lines,
          '',
          `Weekly pulse: **${week.daysWorked}/7 days** · ${week.goalsTouched} goals touched · net +${week.netProgressThisWeek}% · momentum **${week.momentum}**.`,
          week.headline,
          '',
          `Coach focus: **${weakest.title}**.`,
          !weakest.workedToday
            ? 'Not logged yet today — even 15 focused minutes counts. Hit “Worked today” on Goals.'
            : weakest.progress < 40
              ? 'Logged today — good. Define the next milestone in one sentence, then schedule a 25-minute block.'
              : 'You’re mid-climb and already logged today. Close one milestone this week — progress loves finished loops.',
          '',
          week.coachingLine,
        ].join('\n'),
        actions: [
          { label: 'Goals', href: '/goals' },
          { label: 'Link a task', href: '/tasks' },
        ],
        followUps: [
          'How is my weekly progress?',
          'What should I focus on today?',
          ...baseFollowUps.slice(0, 1),
        ],
      };
    }

    case 'finance':
      return {
        intent,
        message: withWisdom(
          'finance',
          [
            `Money pulse for ${snapshot.weekday}:`,
            `• Income: ${snapshot.incomeLabel}`,
            `• Spending: ${snapshot.spendingLabel}`,
            `• Budget used: ~${Math.round(snapshot.budgetUtilizationPct)}%`,
            `• Net worth: ${snapshot.netWorthLabel}`,
            snapshot.topSavingsName
              ? `• Top savings goal: ${snapshot.topSavingsName} (${snapshot.topSavingsPct ?? 0}%)`
              : '• No savings goal yet — name one so surplus has purpose.',
            '',
            snapshot.budgetUtilizationPct >= 85
              ? 'Advice: enter a 48-hour intentional spend freeze on non-essentials. Redirect temptation money to savings.'
              : 'Advice: automate one transfer to savings after every income hit. Systems beat willpower.',
          ].join('\n'),
          Math.round(snapshot.budgetUtilizationPct),
        ),
        actions: [
          { label: 'Finance', href: '/finance' },
          { label: 'Wishlist', href: '/wishlist' },
        ],
        followUps: baseFollowUps,
      };

    case 'health':
      return {
        intent,
        message: withWisdom(
          snapshot.workoutsLast30 < 6 ? 'fitness' : 'health',
          [
            `Body systems report:`,
            `• Sleep (7d avg): ${snapshot.avgSleepHoursLast7 ? `${snapshot.avgSleepHoursLast7.toFixed(1)}h` : 'not logged'} (target ~${snapshot.sleepTargetHours.toFixed(1)}h)`,
            `• Workouts (30d): ${snapshot.workoutsLast30}`,
            snapshot.latestWeightKg
              ? `• Latest weight: ${snapshot.latestWeightKg} kg`
              : '• Weight: not logged recently',
            typeof snapshot.recentEnergy === 'number'
              ? `• Recent energy: ${snapshot.recentEnergy}/10`
              : '',
            '',
            snapshot.workoutsLast30 < 6
              ? 'Advice: schedule movement like a meeting. 20 minutes today beats a perfect plan you skip.'
              : 'Advice: keep the cadence. Add progressive challenge — slightly harder or slightly longer.',
          ]
            .filter(Boolean)
            .join('\n'),
          snapshot.workoutsLast30 + 11,
        ),
        actions: [{ label: 'Health', href: '/health' }],
        followUps: baseFollowUps,
      };

    case 'spiritual':
      return {
        intent,
        message: withWisdom(
          'spiritual',
          [
            `Faith rhythm:`,
            `• Prayer days (7): ${snapshot.prayersLoggedLast7}`,
            `• Skipped prayer days (7): ${snapshot.prayerSkippedDaysLast7}`,
            `• Bible days (7): ${snapshot.bibleDaysLast7}`,
            `• Open prayer requests: ${snapshot.openPrayerRequests}`,
            '',
            snapshot.prayerSkippedDaysLast7 >= 3
              ? 'Advice: return gently. One sincere prayer restores alignment — no shame, just presence.'
              : 'Advice: pair prayer with dawn/morning habits. Soul first, then strategy.',
          ].join('\n'),
          snapshot.prayersLoggedLast7 + 5,
        ),
        actions: [{ label: 'Spiritual Growth', href: '/spiritual' }],
        followUps: baseFollowUps,
      };

    case 'gratitude':
      return {
        intent,
        message: withWisdom(
          'gratitude',
          [
            snapshot.gratitudeToday
              ? `Gratitude already logged today. Streak: **${snapshot.gratitudeStreak}** days.`
              : `No gratitude entry yet today. Streak at risk (current: **${snapshot.gratitudeStreak}**).`,
            '',
            'Prompt: Name 1 person, 1 provision, and 1 personal growth moment you’re thankful for.',
          ].join('\n'),
          snapshot.gratitudeStreak + 7,
        ),
        actions: [{ label: 'Gratitude journal', href: '/gratitude' }],
        followUps: baseFollowUps,
      };

    case 'learning':
      return {
        intent,
        message: withWisdom(
          'learning',
          [
            `Learning engine:`,
            `• Study hours (7d): ${snapshot.studyHoursLast7.toFixed(1)}h`,
            `• Active courses: ${snapshot.activeCourses}`,
            `• Books in progress: ${snapshot.readingBooks}`,
            '',
            snapshot.studyHoursLast7 < 3
              ? 'Advice: protect one deep-work block. Phone in another room. Skill is the highest ROI asset.'
              : 'Advice: convert study into output — notes, code, trades journal, or teaching someone.',
          ].join('\n'),
          Math.round(snapshot.studyHoursLast7 * 10),
        ),
        actions: [{ label: 'Learning', href: '/learning' }],
        followUps: baseFollowUps,
      };

    case 'business':
      return {
        intent,
        message: [
          snapshot.activeBusinesses > 0
            ? `You have **${snapshot.activeBusinesses}** active business trackers.`
            : 'No active business logged yet — ideas become income when tracked.',
          '',
          'Advice for operators: daily revenue action > weekly brainstorming.',
          'Do one of: message a client, ship a deliverable, publish an offer, or record a small win in Business.',
        ].join('\n'),
        actions: [{ label: 'Business', href: '/business' }],
        followUps: baseFollowUps,
      };

    case 'motivation':
      return {
        intent,
        message: withWisdom(
          'best-self',
          [
            `${name}, listen closely.`,
            '',
            'You don’t need a new personality — you need kept promises.',
            `Right now your Best-Self Score is **${score}/100**. That number moves when you move.`,
            '',
            plan[0]
              ? `Immediate win: **${plan[0]}**. Do it before you negotiate with yourself.`
              : 'Open Habits and close one loop. Identity is built in private hours.',
            '',
            'God · Goals · Grinding · Gratitude — stay on all four, and the future has no choice but to open.',
          ].join('\n'),
          score + 19,
        ),
        actions: [
          { label: 'Start with habits', href: '/habits' },
          { label: 'Today’s plan', href: '/ai-coach' },
        ],
        followUps: baseFollowUps,
      };

    case 'stuck':
      return {
        intent,
        message: [
          'Feeling stuck is data, not destiny.',
          '',
          'Tiny rescue protocol (15 minutes):',
          '1) Drink water',
          '2) 10 deep breaths + short prayer',
          '3) One 10-minute action on your #1 open habit or overdue task',
          '4) Log the win',
          '',
          typeof snapshot.recentEnergy === 'number' && snapshot.recentEnergy <= 4
            ? `Your recent energy was ${snapshot.recentEnergy}/10 — shrink the mission, don’t abandon it.`
            : 'Shrink the mission until it’s too small to fear.',
        ].join('\n'),
        actions: [
          { label: 'Clear a task', href: '/tasks' },
          { label: 'Habits', href: '/habits' },
          { label: 'Pray / reflect', href: '/spiritual' },
        ],
        followUps: baseFollowUps,
      };

    case 'best_self':
      return {
        intent,
        message: [
          `Best-self is not a mood — it’s a scoreboard of kept covenants.`,
          '',
          `Current Best-Self Score: **${score}/100**`,
          `Pillar pulse:`,
          `• God: ${snapshot.prayersLoggedLast7}/7 prayer days`,
          `• Goals: ${snapshot.goals.length} active · weakest at ${snapshot.goals[0]?.progress ?? 0}%`,
          `• Grinding: ${snapshot.habitsCompletedToday}/${snapshot.habitsTargetToday} habits · ${snapshot.workoutsLast30} workouts/30d`,
          `• Gratitude: ${snapshot.gratitudeStreak}-day streak`,
          '',
          'Becoming your best self this month means:',
          '1) Non-negotiable morning stack (pray + one grind habit)',
          '2) One measurable goal moved weekly',
          '3) Nightly gratitude + review',
          '',
          'I can walk with you daily — ask for a plan anytime.',
        ].join('\n'),
        actions: [
          { label: 'Daily Review', href: '/review' },
          { label: 'Goals', href: '/goals' },
          { label: 'Habits', href: '/habits' },
        ],
        followUps: baseFollowUps,
        insights: insights.slice(0, 4),
      };

    case 'review':
      return {
        intent,
        message: [
          `Progress review for ${name}:`,
          `• Best-Self Score: **${score}/100**`,
          `• Habits today: ${snapshot.habitsCompletedToday}/${snapshot.habitsTargetToday}`,
          `• Goals this week: ${snapshot.goalWeek.daysWorked}/7 days · +${snapshot.goalWeek.netProgressThisWeek}% · ${snapshot.goalWeek.momentum}`,
          `• Tasks done today: ${snapshot.tasksDoneToday} · overdue: ${snapshot.overdueTasks}`,
          `• Prayer days (7): ${snapshot.prayersLoggedLast7}`,
          `• Study hours (7): ${snapshot.studyHoursLast7.toFixed(1)}`,
          `• Money: spent ${snapshot.spendingLabel} / earned ${snapshot.incomeLabel}`,
          '',
          snapshot.goalWeek.headline,
          snapshot.goalWeek.coachingLine,
          '',
          snapshot.checkInToday
            ? 'Daily Review already saved — excellent loop closure.'
            : 'Daily Review still open. Closing loops is how operators sleep in peace.',
          '',
          'Top insight:',
          insights[0]?.message ?? 'Keep logging — the coach gets sharper with your data.',
          insights[0]?.advice ? `\nAdvice: ${insights[0].advice}` : '',
        ].join('\n'),
        actions: [
          { label: 'Daily Review', href: '/review' },
          { label: 'Goals', href: '/goals' },
          { label: 'Statistics', href: '/statistics' },
        ],
        followUps: baseFollowUps,
        insights: insights.slice(0, 5),
      };

    case 'help':
      return {
        intent,
        message: [
          'I analyze your live Mission Control data and coach you across the 4 G’s.',
          '',
          'Try asking:',
          '• What should I focus on today?',
          '• How are my habits / goals / money / health?',
          '• I feel stuck',
          '• Help me become my best self',
          '• How am I doing overall?',
          '',
          'I’m interactive, local, and private — no cloud required.',
        ].join('\n'),
        actions: [{ label: 'Dashboard', href: '/' }],
        followUps: baseFollowUps,
      };

    default: {
      const top = insights[0];
      return {
        intent: 'general',
        message: [
          `I hear you, ${name}. Based on your live data:`,
          '',
          top
            ? `${top.message}${top.advice ? `\n\nAdvice: ${top.advice}` : ''}`
            : 'Log a bit more activity and I’ll sharpen the guidance.',
          '',
          plan[0] ? `Suggested next move: **${plan[0]}**` : '',
          '',
          'Ask a sharper question (habits, goals, money, faith, health) and I’ll go deeper.',
        ]
          .filter(Boolean)
          .join('\n'),
        actions: top?.actions ?? [
          { label: 'Today’s plan', href: '/ai-coach' },
          { label: 'Habits', href: '/habits' },
        ],
        followUps: baseFollowUps,
        insights: insights.slice(0, 3),
      };
    }
  }
}

export const SUGGESTED_PROMPTS = [
  'What should I focus on today?',
  'How am I doing overall?',
  'Help me with my goals',
  'Check my habits',
  'I feel stuck',
  'Motivate me',
  'Spiritual check-in',
  'Help me become my best self',
  'Money check',
  'Health advice',
];
