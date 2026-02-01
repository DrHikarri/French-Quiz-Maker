
export class SpeechManager {
  recognition: any = null;
  synth: SpeechSynthesis = window.speechSynthesis;
  private isManuallyStopped = false;

  constructor(lang: string = 'fr-FR', onEndCallback?: () => void) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = lang;

      this.recognition.onend = () => {
        if (onEndCallback) onEndCallback();
      };
    }
  }

  start(): void {
    this.isManuallyStopped = false;
    try {
      this.recognition?.start();
    } catch (e) {
      console.warn("Speech recognition already started or failed to start", e);
    }
  }

  stop(): void {
    this.isManuallyStopped = true;
    try {
      this.recognition?.stop();
    } catch (e) {
      console.warn("Speech recognition failed to stop", e);
    }
  }

  speak(text: string, voiceName?: string, rate: number = 1.0) {
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = this.synth.getVoices();
    if (voiceName) {
      const voice = voices.find(v => v.name === voiceName);
      if (voice) utterance.voice = voice;
    }
    utterance.rate = rate;
    this.synth.speak(utterance);
  }

  getVoices() {
    return this.synth.getVoices();
  }
}
