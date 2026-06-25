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
import { Loader2, Copy, Volume2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// 支持的语言列表
const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' },
  { code: 'th', name: 'ไทย' },
  { code: 'vi', name: 'Tiếng Việt' },
];

export default function TextTranslatorClient() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [isLoading, setIsLoading] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: '请输入要翻译的文本',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setTranslatedText('');

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          source: sourceLang === 'auto' ? 'auto' : sourceLang,
          target: targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      setTranslatedText(data.translatedText);
      
      toast({
        title: '翻译完成',
        description: '文本已成功翻译',
      });
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: '翻译失败',
        description: '请稍后重试或检查网络连接',
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
      toast({
        title: '已复制',
        description: '翻译结果已复制到剪贴板',
      });
    } catch (error) {
      toast({
        title: '复制失败',
        variant: 'destructive',
      });
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      toast({
        title: '无法交换',
        description: '自动检测语言时无法交换',
        variant: 'destructive',
      });
      return;
    }
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">文本翻译工具</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 语言选择 */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">源语言</label>
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger>
                <SelectValue placeholder="选择源语言" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">自动检测</SelectItem>
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
            onClick={handleSwapLanguages}
            className="mt-8"
          >
            ⇄
          </Button>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">目标语言</label>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger>
                <SelectValue placeholder="选择目标语言" />
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
        </div>

        {/* 源文本输入 */}
        <div>
          <label className="text-sm font-medium mb-2 block">输入文本</label>
          <Textarea
            placeholder="请输入要翻译的文本..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="min-h-[150px]"
          />
        </div>

        {/* 翻译按钮 */}
        <Button
          onClick={handleTranslate}
          disabled={isLoading || !sourceText.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              翻译中...
            </>
          ) : (
            '翻译'
          )}
        </Button>

        {/* 翻译结果 */}
        {translatedText && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">翻译结果</label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  复制
                </Button>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg min-h-[150px] whitespace-pre-wrap">
              {translatedText}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
