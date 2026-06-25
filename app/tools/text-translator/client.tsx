'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Copy, ArrowUpDown, X, Volume2, VolumeX, Check, Languages, AlertCircle } from 'lucide-react';

const languages = [
  { code: 'auto', name: 'Detect Language', flag: '\u{1F50D}' },
  { code: 'en', name: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'ja', name: 'Japanese', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'ko', name: 'Korean', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'fr', name: 'French', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'de', name: 'German', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'es', name: 'Spanish', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'pt', name: 'Portuguese', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'ru', name: 'Russian', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'ar', name: 'Arabic', flag: '\u{1F1E6}\u{1F1EA}' },
  { code: 'th', name: 'Thai', flag: '\u{1F1F9}\u{1F1ED}' },
  { code: 'vi', name: 'Vietnamese', flag: '\u{1F1FB}\u{1F1F3}' },
  { code: 'it', name: 'Italian', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'nl', name: 'Dutch', flag: '\u{1F1F3}\u{1F1F1}' },
  { code: 'pl', name: 'Polish', flag: '\u{1F1F5}\u{1F1F1}' },
  { code: 'tr', name: 'Turkish', flag: '\u{1F1F9}\u{1F1F7}' },
  { code: 'hi', name: 'Hindi', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'id', name: 'Indonesian', flag: '\u{1F1EE}\u{1F1E9}' },
  { code: 'ms', name: 'Malay', flag: '\u{1F1F2}\u{1F1FE}' },
  { code: 'uk', name: 'Ukrainian', flag: '\u{1F1FA}\u{1F1E6}' },
  { code: 'cs', name: 'Czech', flag: '\u{1F1E8}\u{1F1FF}' },
  { code: 'sv', name: 'Swedish', flag: '\u{1F1F8}\u{1F1EA}' },
  { code: 'da', name: 'Danish', flag: '\u{1F1E9}\u{1F1F0}' },
  { code: 'fi', name: 'Finnish', flag: '\u{1F1EB}\u{1F1EE}' },
  { code: 'el', name: 'Greek', flag: '\u{1F1EC}\u{1F1F7}' },
  { code: 'he', name: 'Hebrew', flag: '\u{1F1EE}\u{1F1F7}' },
  { code: 'bn', name: 'Bengali', flag: '\u{1F1E7}\u{1F1E9}' },
  { code: 'ta', name: 'Tamil', flag: '\u{1F1F3}\u{1F1F0}' },
  { code: 'te', name: 'Telugu', flag: '\u{1F1F3}\u{1F1F4}' },
];

const targetLanguages = languages.filter(l => l.code !== 'auto');

export default function TextTranslatorClient() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedLang, setDetectedLang] = useState('');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Perform translation
  const doTranslate = useCallback(async (text: string, source: string, target: string) => {
    if (!text.trim()) {
      setTranslatedText('');
      setError('');
      return;
    }

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source, target }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Translation failed');

      setTranslatedText(data.translatedText);
      if (data.detectedLanguage && data.detectedLanguage !== source && source === 'auto') {
        const detected = languages.find(l => l.code === data.detectedLanguage);
        setDetectedLang(detected?.name || data.detectedLanguage);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return; // Debounce cancel, not an error
      console.error('Translation error:', err);
      setError(err.message || 'Translation failed. Please try again.');
      setTranslatedText('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-translate with debounce
  useEffect(() => {
    if (!autoTranslate) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doTranslate(sourceText, sourceLang, targetLang);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sourceText, sourceLang, targetLang, autoTranslate, doTranslate]);

  // Manual translate handler
  const handleTranslate = () => doTranslate(sourceText, sourceLang, targetLang);

  // Keyboard shortcut: Ctrl/Cmd + Enter to translate
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleTranslate();
    }
  };

  // Copy translated text
  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = translatedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Text-to-Speech
  const handleSpeak = () => {
    if (!translatedText) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = targetLang;
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Swap languages
  const handleSwap = () => {
    if (sourceLang === 'auto') {
      // When auto-detect is on, just swap target with a common language
      const detectedCode = detectedLang
        ? languages.find(l => l.name === detectedLang)?.code
        : null;
      if (detectedCode && detectedCode !== 'auto') {
        setSourceLang(targetLang);
        setTargetLang(detectedCode);
      } else {
        setSourceLang('en');
        setTargetLang('auto' ? 'en' : targetLang); // fallback
      }
    } else {
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
    }
    setSourceText(translatedText);
    setTranslatedText('');
    setDetectedLang('');
  };

  // Clear all
  const handleClear = () => {
    setSourceText('');
    setTranslatedText('');
    setError('');
    setDetectedLang('');
    if (abortRef.current) abortRef.current.abort();
  };

  // Character count label
  const charCount = sourceText.length;
  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;
  const outputCharCount = translatedText.length;

  return (
    <div className="space-y-6">
      {/* Main translator card */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Languages className="h-4 w-4" />
            <span>Text Translator</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-translate toggle */}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={autoTranslate}
                onCheckedChange={setAutoTranslate}
                className="h-4 w-4"
              />
              <span className="hidden sm:inline">Auto</span>
            </label>

            {/* Clear */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8"
              title="Clear all"
              disabled={!sourceText && !translatedText}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Language bar + Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
          {/* ===== SOURCE PANEL (Left) ===== */}
          <div className="flex flex-col">
            {/* Source language selector */}
            <div className="flex items-center border-b px-4 py-2 sm:px-6">
              <Select value={sourceLang} onValueChange={(v) => { setSourceLang(v); setDetectedLang(''); }}>
                <SelectTrigger className="h-9 border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>span]:font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Detected language badge */}
            {detectedLang && (
              <div className="px-4 py-1 sm:px-6">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Detected: {detectedLang}
                  <button
                    onClick={() => { setSourceLang(languages.find(l => l.name === detectedLang)?.code || 'auto'); setDetectedLang(''); }}
                    className="ml-1 underline hover:text-primary/80"
                  >
                    Use this
                  </button>
                </span>
              </div>
            )}

            {/* Source textarea */}
            <div className="relative flex-1">
              <Textarea
                placeholder="Enter text to translate..."
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[280px] resize-y rounded-none border-0 bg-transparent py-4 text-base shadow-none focus-visible:ring-0 sm:min-h-[340px] sm:px-6"
              />

              {/* Character count - bottom right of input */}
              <div className="absolute bottom-2 right-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{charCount} / 5000</span>
              </div>
            </div>
          </div>

          {/* ===== SWAP BUTTON (center, mobile: between panels) ===== */}
          <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block lg:left-[calc(50%-0px)]">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwap}
              className="h-10 w-10 rounded-full border-2 bg-background shadow-md hover:bg-muted"
              title="Swap languages"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* ===== TARGET PANEL (Right) ===== */}
          <div className="relative flex flex-col">
            {/* Target language selector + actions */}
            <div className="flex items-center justify-between border-b px-4 py-2 sm:px-6">
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="h-9 border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>span]:font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {targetLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Output action buttons */}
              <div className="flex items-center gap-0.5">
                {translatedText && !isLoading && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSpeak}
                      className="h-8 w-8"
                      title={isSpeaking ? 'Stop speaking' : 'Listen to translation'}
                    >
                      {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopy}
                      className="h-8 w-8"
                      title="Copy translation"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Output area - always visible */}
            <div className="relative min-h-[280px] flex-1 bg-muted/20 sm:min-h-[340px]">
              {isLoading && (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm">Translating...</span>
                  </div>
                </div>
              )}

              {error && !isLoading && (
                <div className="flex h-full items-center justify-center p-6">
                  <div className="flex flex-col items-center gap-2 text-center text-destructive">
                    <AlertCircle className="h-8 w-8" />
                    <p className="text-sm">{error}</p>
                    <Button variant="outline" size="sm" onClick={handleTranslate} className="mt-2">
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {!isLoading && !error && !translatedText && (
                <div className="flex h-full items-center justify-center p-6">
                  <div className="max-w-[260px] text-center text-muted-foreground">
                    <Languages className="mx-auto mb-3 h-10 w-10 opacity-30" />
                    <p className="text-sm leading-relaxed">
                      Translation will appear here. Type something and click Translate, or enable Auto mode.
                    </p>
                  </div>
                </div>
              )}

              {!isLoading && !error && translatedText && (
                <>
                  <div className="whitespace-pre-wrap break-words p-4 text-base leading-relaxed sm:p-6 sm:text-lg">
                    {translatedText}
                  </div>
                  <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                    {outputCharCount} characters
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar - Translate button + word count */}
        {!autoTranslate && (
          <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3 sm:px-6">
            <div className="text-xs text-muted-foreground">
              {wordCount > 0 && `${wordCount} words`}&middot; {charCount} characters
            </div>
            <Button
              onClick={handleTranslate}
              disabled={isLoading || !sourceText.trim()}
              size="lg"
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                'Translate'
              )}
            </Button>
          </div>
        )}

        {/* Mobile swap button */}
        <div className="border-t bg-muted/30 px-4 py-2 text-center md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwap}
            className="gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            Swap Languages
          </Button>
        </div>
      </div>

      {/* Quick tips */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card/50 p-4 text-center">
          <div className="mb-1 text-lg">⌨️</div>
          <p className="text-sm font-medium">Keyboard Shortcut</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Ctrl + Enter to translate</p>
        </div>
        <div className="rounded-xl border bg-card/50 p-4 text-center">
          <div className="mb-1 text-lg">🔄</div>
          <p className="text-sm font-medium">Auto Translate</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Toggle for instant results as you type</p>
        </div>
        <div className="rounded-xl border bg-card/50 p-4 text-center">
          <div className="mb-1 text-lg">🔊</div>
          <p className="text-sm font-medium">Text-to-Speech</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Listen to the translated result aloud</p>
        </div>
      </div>

      {/* SEO Content Section */}
      <div className="prose max-w-none rounded-2xl border bg-card p-6 sm:p-8 dark:prose-invert">
        <h2 className="text-xl font-semibold">How to Use the Online Text Translator</h2>
        <ol>
          <li><strong>Select the source language</strong> or leave it on &quot;Detect Language&quot; for automatic detection.</li>
          <li><strong>Choose your target language</strong> from 30+ supported languages.</li>
          <li><strong>Type or paste your text</strong> into the left panel. Enable &quot;Auto&quot; for real-time translation, or press Ctrl+Enter / click the Translate button.</li>
          <li><strong>Copy or listen</strong> to your translated result using the buttons above the output panel.</li>
        </ol>

        <h2 className="pt-4 text-xl font-semibold">Supported Languages</h2>
        <p>Our free online translator supports over 30 language pairs:</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm not-prose sm:grid-cols-3">
          {targetLanguages.map((l) => (
            <span key={l.code}>{l.flag} {l.name}</span>
          ))}
        </div>

        <h2 className="pt-4 text-xl font-semibold">Why Use This Free Translator?</h2>
        <ul>
          <li><strong>100% Free &amp; No Signup</strong> — Start translating immediately without creating an account.</li>
          <li><strong>Privacy-Focused</strong> — Your text is sent directly to the translation API and is never stored on our servers.</li>
          <li><strong>Auto-Detection</strong> — Automatically identifies the source language so you don&apos;t have to manually select it.</li>
          <li><strong>Real-Time Translation</strong> — Enable Auto mode to see translations instantly as you type (with smart debounce).</li>
          <li><strong>Text-to-Speech</strong> — Hear the correct pronunciation of your translation using browser-based TTS.</li>
          <li><strong>Works on All Devices</strong> — Fully responsive design that works on desktop, tablet, and mobile phones.</li>
        </ul>
      </div>
    </div>
  );
}
