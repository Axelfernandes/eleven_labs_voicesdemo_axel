'use client';

import { useState, useRef, useEffect } from 'react';
import { VOICES, EMOTIONS } from '../constants/voices';
import { Play, Loader2, Volume2, Mic2, Sparkles, Download } from 'lucide-react';

export default function Home() {
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [emotion, setEmotion] = useState(EMOTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle playback rate adjustment (e.g., for Whisper)
  useEffect(() => {
    if (audioRef.current) {
      if (emotion === 'Whisper') {
        audioRef.current.playbackRate = 0.85;
      } else {
        audioRef.current.playbackRate = 1.0;
      }
    }
  }, [audioUrl, emotion]);

  const handleNarrate = async () => {
    if (!text) return;

    setIsLoading(true);
    setAudioUrl(null);

    try {
      const response = await fetch('/api/narrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voiceId, emotion }),
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(JSON.stringify(errorDetails));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error: any) {
      console.error('Narration error:', error);
      alert(`Failed to generate narration: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadMetrics = () => {
    window.open('/api/metrics/export', '_blank');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl glass rounded-3xl p-6 md:p-10 shadow-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            <span className="gradient-text">Emo Narrator</span>
          </h1>
          <p className="text-slate-400 text-lg">Bring your words to life with emotional AI voices</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Input */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Mic2 size={16} className="text-primary" />
                Text to Narrate
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type something that sounds emotional..."
                className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <button
              onClick={handleNarrate}
              disabled={isLoading || !text}
              className="w-full py-4 bg-gradient-to-r from-primary to-secondary rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-primary/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Narrate Now
                </>
              )}
            </button>
          </div>

          {/* Right Column: Settings */}
          <div className="space-y-6">
            {/* Voice Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Volume2 size={16} className="text-secondary" />
                Choose Voice
              </label>
              <div className="grid grid-cols-2 gap-2">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setVoiceId(voice.id)}
                    className={`p-3 rounded-xl border text-sm transition-all text-left space-y-1 ${voiceId === voice.id
                      ? 'bg-primary/20 border-primary text-primary shadow-inner shadow-primary/10'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                  >
                    <div className="font-bold">{voice.name}</div>
                    <div className="text-[10px] opacity-60 leading-tight">{voice.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Emotion Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Sparkles size={16} className="text-secondary" />
                Emotion Preset
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((emp) => (
                  <button
                    key={emp}
                    onClick={() => setEmotion(emp)}
                    className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all ${emotion === emp
                      ? 'bg-secondary/20 border-secondary text-secondary'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                  >
                    {emp}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Player Container */}
            {audioUrl && (
              <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-primary rounded-full">
                    <Play size={20} fill="white" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-bold text-primary tracking-wider uppercase">Generated Audio</div>
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      controls
                      autoPlay
                      className="w-full h-8 accent-primary"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-8 flex flex-col items-center gap-4">
        <button
          onClick={handleDownloadMetrics}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <Download size={14} />
          Download Narration History (CSV)
        </button>
        <div className="text-slate-500 text-sm">
          Powered by <span className="text-slate-300 font-medium italic">ElevenLabs</span> & <span className="text-slate-300 font-medium">AWS Amplify</span>
        </div>
      </footer>
    </main>
  );
}
