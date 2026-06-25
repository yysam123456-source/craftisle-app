'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, ArrowUpDown, X, Volume2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const languages = [
  { code: 'auto', name: 'Auto Detect' },
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'hi', name: 'Hindi' },
];

export default function TextTranslatorClient() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: 'Please enter text to translate',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setTranslatedText('');

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          source: sourceLang,
          target: targetLang,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }

      setTranslatedText(data.translatedText);
      toast({
        title: 'Translation complete',
        description: 'Text has been successfully translated.',
      });
    } catch (error: any) {
      console.error('Translation error:', error);
      toast({
        title: 'Translation failed',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      toast({ title: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleSwap = () => {
    if (sourceLang === 'auto') {
      toast({ title: 'Cannot swap when auto-detect is on', variant: 'destructive' });
      return;
    }
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText('');
  };

  const handleClear = () => {
    setSourceText('');
    setTranslatedText('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Text Translator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language selectors */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">From</label>
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleSwap}
            className="mt-6 shrink-0"
            title="Swap languages"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">To</label>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.filter(l => l.code !== 'auto').map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Input area */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">Input</label>
            <span className="text-xs text-muted-foreground">
              {sourceText.length} characters
            </span>
          </div>
          <Textarea
            placeholder="Type or paste text here..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="min-h-[140px] text-base"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleTranslate}
            disabled={isLoading || !sourceText.trim()}
            className="flex-1"
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
          <Button variant="outline" onClick={handleClear} disabled={!sourceText && !translatedText}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Output area */}
        {translatedText && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Translation</label>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg min-h-[140px] whitespace-pre-wrap text-base border">
              {translatedText}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
