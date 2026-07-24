/** Browser speech synthesis + recognition for the G4 Coach. */

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const MALE_VOICE_HINTS = [
  'male',
  'david',
  'mark',
  'james',
  'daniel',
  'thomas',
  'george',
  'ryan',
  'guy',
  'aaron',
  'arthur',
  'ravi',
  'fred',
  'alex', // macOS often male
  'bruce',
  'ralph',
  'tom',
  'microsoft david',
  'microsoft mark',
  'microsoft guy',
  'google uk english male',
  'en-us-standard-b',
  'en-us-standard-d',
  'en-gb-standard-b',
  'en-gb-standard-d',
];

const FEMALE_VOICE_HINTS = [
  'female',
  'zira',
  'susan',
  'samantha',
  'karen',
  'moira',
  'tessa',
  'fiona',
  'veena',
  'victoria',
  'kate',
  'hazel',
  'heather',
  'linda',
  'jenny',
  'aria',
  'sonia',
  'microsoft zira',
  'google uk english female',
];

function preferredVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const ranked = voices
    .map((v) => {
      let score = 0;
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      if (lang.startsWith('en')) score += 10;
      if (lang.includes('en-us') || lang.includes('en-gb') || lang.includes('en-ke') || lang.includes('en-au'))
        score += 4;
      if (name.includes('natural') || name.includes('neural') || name.includes('premium'))
        score += 8;
      if (name.includes('google') || name.includes('microsoft')) score += 6;
      if (MALE_VOICE_HINTS.some((h) => name.includes(h))) score += 40;
      if (FEMALE_VOICE_HINTS.some((h) => name.includes(h))) score -= 50;
      if (v.localService) score += 1;
      return { v, score };
    })
    .sort((a, b) => b.score - a.score);

  const malePick = ranked.find((r) =>
    MALE_VOICE_HINTS.some((h) => r.v.name.toLowerCase().includes(h)),
  );
  return malePick?.v ?? ranked[0]?.v ?? voices[0] ?? null;
}

let voicesReady: Promise<void> | null = null;

function ensureVoices(): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return Promise.resolve();
  }
  if (window.speechSynthesis.getVoices().length) return Promise.resolve();
  if (voicesReady) return voicesReady;
  voicesReady = new Promise((resolve) => {
    const done = () => resolve();
    window.speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    window.setTimeout(done, 800);
  });
  return voicesReady;
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function canListen(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

export async function speakText(
  text: string,
  options?: { rate?: number; pitch?: number; onend?: () => void },
): Promise<void> {
  if (!canSpeak() || !text.trim()) return;
  await ensureVoices();
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  const voice = preferredVoice();
  if (voice) utter.voice = voice;
  utter.rate = options?.rate ?? 0.94;
  // Slightly lower pitch keeps the coach sounding male even on generic voices.
  utter.pitch = options?.pitch ?? 0.88;
  utter.volume = 1;
  if (options?.onend) utter.onend = options.onend;

  window.speechSynthesis.speak(utter);
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  return canSpeak() && window.speechSynthesis.speaking;
}

export function startListening(handlers: {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}): () => void {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) {
    handlers.onError?.('Speech recognition is not supported in this browser.');
    return () => undefined;
  }

  const recognition = new Ctor();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript?.trim();
    if (transcript) handlers.onResult(transcript);
  };
  recognition.onerror = (event) => {
    handlers.onError?.(event.error || 'listen_failed');
  };
  recognition.onend = () => {
    handlers.onEnd?.();
  };

  try {
    recognition.start();
  } catch {
    handlers.onError?.('Could not start microphone.');
  }

  return () => {
    try {
      recognition.abort();
    } catch {
      /* ignore */
    }
  };
}
