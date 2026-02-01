
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quiz, Card, Attempt, Settings, QuizSessionState } from '../types';
import { SpeechManager } from '../SpeechManager';
import { calculateSimilarity, getDiff } from '../utils';
import { DB } from '../db';

interface QuizPlayerProps {
  quiz: Quiz;
  allCards: Card[];
  onFinish: (results: { attempts: Attempt[]; xpGained: number; timeSpent: number }) => void;
  onExit: () => void;
  onAddAttempt: (a: Attempt) => void;
  settings: Settings;
  initialSession?: QuizSessionState | null;
  onListeningChange?: (isListening: boolean) => void;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, allCards, onFinish, onExit, onAddAttempt, settings, initialSession, onListeningChange }) => {
  const [currentIndex, setCurrentIndex] = useState(initialSession?.currentIndex || 0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    bestSentence: string;
    coreScore: number;
    accentScore: number;
    diff: any[];
    revealed: boolean;
  } | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  
  const [sessionAttempts, setSessionAttempts] = useState<Attempt[]>(initialSession?.sessionAttempts || []);
  const [startTime] = useState(initialSession?.startTime || Date.now());
  const [error, setError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [stuckWatchdog, setStuckWatchdog] = useState(false);
  
  // Track if result was received during current session to handle 'no speech' onEnd
  const resultReceived = useRef(false);
  const manualStop = useRef(false);

  const card = allCards[currentIndex];

  const onSpeechEnd = useCallback(() => {
    setIsListening(false);
    onListeningChange?.(false);
    
    // If we finished listening but didn't get a result and wasn't manually stopped, it's likely silence/no-speech
    if (!resultReceived.current && !manualStop.current) {
        setFeedbackError("No speech detected. Please try again.");
    }
  }, [onListeningChange]);

  const speechManager = useRef(new SpeechManager(quiz.settings.language, onSpeechEnd));

  useEffect(() => {
    if (!speechManager.current.recognition) {
      setError("Speech recognition is not supported in this browser.");
    }
  }, []);

  // Watchdog logic
  useEffect(() => {
    let timer: number;
    if (isListening) {
      setStuckWatchdog(false);
      timer = window.setTimeout(() => {
        setStuckWatchdog(true);
      }, 8000); // 8 seconds timeout
    }
    return () => clearTimeout(timer);
  }, [isListening]);

  const handleStartListening = () => {
    setTranscript('');
    setFeedback(null);
    setFeedbackError(null);
    setIsListening(true);
    onListeningChange?.(true);
    setStuckWatchdog(false);
    
    resultReceived.current = false;
    manualStop.current = false;
    
    speechManager.current.start();
    
    // Override result handler
    speechManager.current.recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      if (result) {
        resultReceived.current = true;
        setTranscript(result);
        processResult(result);
        setIsListening(false);
        onListeningChange?.(false);
      }
    };

    speechManager.current.recognition.onerror = (err: any) => {
      console.error(err);
      setIsListening(false);
      onListeningChange?.(false);
      if (err.error !== 'no-speech') {
        setError("Microphone error: " + err.error);
      } else {
        // no-speech handled in onEnd
      }
    };
  };

  const handleStopListening = () => {
    manualStop.current = true;
    speechManager.current.stop();
    setIsListening(false);
    onListeningChange?.(false);
  };

  const handleResetMic = () => {
    handleStopListening();
    setTimeout(handleStartListening, 100);
  };

  const processResult = (text: string) => {
    const allAccepted = [card.targetSentence, ...card.acceptedSentences];
    let bestMatch = allAccepted[0];
    let maxCore = -1;
    let maxAccent = -1;

    allAccepted.forEach(sentence => {
      const core = calculateSimilarity(sentence, text, true);
      const accent = calculateSimilarity(sentence, text, false);
      if (core > maxCore) {
        maxCore = core;
        maxAccent = accent;
        bestMatch = sentence;
      }
    });

    const isPass = maxCore >= quiz.settings.goalScore;
    const alreadyPassedThisSession = sessionAttempts.some(a => a.cardId === card.id && a.passed);
    const xp = alreadyPassedThisSession ? 0 : (isPass ? 20 : (maxCore > 0 ? 5 : 0));

    const attempt: Attempt = {
      id: Date.now().toString(),
      cardId: card.id,
      quizId: quiz.id,
      timestamp: Date.now(),
      coreScore: maxCore,
      accentScore: maxAccent,
      passed: isPass,
      xpChange: xp,
      transcript: text
    };

    onAddAttempt(attempt);
    setSessionAttempts(prev => [...prev, attempt]);
    setFeedback({
      bestSentence: bestMatch,
      coreScore: maxCore,
      accentScore: maxAccent,
      diff: getDiff(bestMatch, text),
      revealed: false // Auto-submit doesn't mean reveal correct answer immediately, but we show the score. User can click Reveal or Next.
    });
  };

  const handleNext = () => {
    if (currentIndex < allCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTranscript('');
      setFeedback(null);
      setFeedbackError(null);
    } else {
      onFinish({
        attempts: sessionAttempts,
        xpGained: sessionAttempts.reduce((acc, curr) => acc + curr.xpChange, 0),
        timeSpent: Date.now() - startTime
      });
    }
  };

  const handleExitRequest = () => {
    handleStopListening();
    setShowExitConfirm(true);
  };

  const handleFinalExit = () => {
    DB.saveSession({
      quizId: quiz.id,
      currentIndex,
      sessionAttempts,
      startTime,
      pausedAt: Date.now()
    });
    onExit();
  };

  const handlePlayAudio = () => {
    // Audio is always enabled now
    if (card.audioOverride) {
      try {
        const audio = new Audio(card.audioOverride);
        audio.playbackRate = playbackRate;
        audio.play().catch(() => {
          // Fallback to TTS if file playback fails
          speechManager.current.speak(card.preferredModelAnswer || card.targetSentence, undefined, playbackRate);
        });
      } catch (e) {
        speechManager.current.speak(card.preferredModelAnswer || card.targetSentence, undefined, playbackRate);
      }
    } else {
      speechManager.current.speak(card.preferredModelAnswer || card.targetSentence, undefined, playbackRate);
    }
  };

  if (error) return <div className="p-20 text-center text-rose-500 font-bold">{error}</div>;
  if (!card) return <div className="p-20 text-center">No cards found.</div>;

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pt-4 md:pt-10 relative">
      <div className="flex items-center justify-between px-4 mb-4">
        <button 
          onClick={handleExitRequest}
          className="z-50 px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors"
        >
          <i className="fa-solid fa-xmark mr-2"></i> Exit Quiz
        </button>
        <div className="flex-1 flex justify-center px-4">
          <div className="flex gap-1 w-full max-w-xs">
            {allCards.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 flex-1 rounded-full ${idx === currentIndex ? 'bg-indigo-600' : idx < currentIndex ? 'bg-indigo-300' : 'bg-slate-200 dark:bg-slate-800'}`}
              ></div>
            ))}
          </div>
        </div>
        <span className="text-xs font-bold text-slate-400">{currentIndex + 1} / {allCards.length}</span>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col relative md:min-h-[600px]">
        <div 
          className="h-1/2 overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center cursor-pointer group"
          onClick={() => { handleStopListening(); setLightboxOpen(true); }}
        >
          <img src={card.image} alt="Describe this" className="max-w-full max-h-full object-contain transition-transform group-hover:scale-[1.02]" />
          <div className="absolute top-4 right-4 h-10 w-10 bg-black/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <i className="fa-solid fa-maximize"></i>
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-6">
          {!feedback ? (
            <div className="space-y-4 w-full">
              <p className="text-slate-500 font-medium italic">Describe what you see in {quiz.settings.language}</p>
              
              <div className="flex flex-col items-center gap-4">
                {isListening ? (
                  <button 
                    onClick={handleStopListening}
                    className="h-24 w-24 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200 animate-pulse transition-all hover:scale-105 active:scale-95"
                  >
                    <i className="fa-solid fa-square text-3xl"></i>
                  </button>
                ) : (
                  <button 
                    onClick={handleStartListening}
                    className="h-24 w-24 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                  >
                    <i className="fa-solid fa-microphone text-3xl"></i>
                  </button>
                )}
                
                {isListening && (
                  <div className="space-y-2">
                    <p className="text-rose-500 font-bold">Listening...</p>
                    {stuckWatchdog && (
                      <div className="animate-in fade-in duration-300">
                        <p className="text-xs text-slate-400 mb-2">No input detected?</p>
                        <button onClick={handleResetMic} className="text-xs font-bold text-indigo-600 underline">Reset Microphone</button>
                      </div>
                    )}
                  </div>
                )}
                
                {feedbackError && (
                   <div className="animate-in fade-in duration-300">
                      <p className="text-amber-500 font-bold">{feedbackError}</p>
                   </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full animate-in zoom-in-95 duration-300">
              <div className="mb-4">
                 <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">You said:</p>
                 <p className="text-2xl font-bold dark:text-white">"{transcript || '...'}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">Match Score</p>
                  <p className={`text-2xl font-black ${feedback.coreScore >= quiz.settings.goalScore ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {feedback.coreScore}%
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">Accent</p>
                  <p className="text-2xl font-black text-indigo-500">{feedback.accentScore}%</p>
                </div>
              </div>

              {feedback.revealed && (
                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl">
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2">Model Answer:</p>
                  <p className="text-lg font-semibold dark:text-slate-200 mb-4">
                    {feedback.diff.map((d, i) => (
                      <span key={i} className={`mx-0.5 ${d.status === 'correct' ? '' : d.status === 'accent-error' ? 'text-amber-600 underline' : 'text-slate-400 opacity-50'}`}>
                        {d.word}
                      </span>
                    ))}
                  </p>
                  <div className="flex flex-wrap justify-center items-center gap-3">
                    <button onClick={handlePlayAudio} className="h-12 w-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 shadow-md">
                      <i className="fa-solid fa-volume-high"></i>
                    </button>
                    <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1">
                      {[0.8, 1.0, 1.2].map(rate => (
                        <button 
                          key={rate} 
                          onClick={() => setPlaybackRate(rate)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${playbackRate === rate ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 'text-slate-400'}`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-4">
                <button onClick={handleStartListening} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 dark:text-white font-bold rounded-xl">Retry</button>
                {!feedback.revealed ? (
                  <button onClick={() => setFeedback({...feedback, revealed: true})} className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-md">Reveal</button>
                ) : (
                  <button onClick={handleNext} className="px-10 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg">
                    {currentIndex < allCards.length - 1 ? 'Next' : 'Finish'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxOpen(false)}
        >
          <img src={card.image} alt="Full view" className="max-w-full max-h-full object-contain animate-in zoom-in-95" />
          <button className="absolute top-6 right-6 text-white text-3xl"><i className="fa-solid fa-xmark"></i></button>
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold dark:text-white mb-2">Exit Quiz?</h3>
            <p className="text-slate-500 mb-6 text-sm">Your progress will be saved for later.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleFinalExit}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg"
              >
                Exit
              </button>
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPlayer;
