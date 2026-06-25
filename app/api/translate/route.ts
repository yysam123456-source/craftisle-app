import { NextRequest, NextResponse } from 'next/server';

// MyMemory Translation API (免费，无需 API key)
const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';

export async function POST(request: NextRequest) {
  try {
    const { text, source, target } = await request.json();

    // 验证输入
    if (!text || !target) {
      return NextResponse.json(
        { error: 'Missing required fields: text, target' },
        { status: 400 }
      );
    }

    // 构建 MyMemory API 请求
    // 注意：MyMemory 的 langpair 格式是 "en|zh"
    const langpair = `${source === 'auto' ? 'en' : source}|${target}`;
    
    const response = await fetch(
      `${MYMEMORY_API_URL}?q=${encodeURIComponent(text)}&langpair=${langpair}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      console.error('MyMemory API error:', response.statusText);
      return NextResponse.json(
        { error: 'Translation service error' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // MyMemory API 返回格式：
    // { responseData: { translatedText: "..." }, responseStatus: 200 }
    if (data.responseStatus !== 200) {
      console.error('MyMemory API error:', data.responseMessage);
      return NextResponse.json(
        { error: 'Translation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      translatedText: data.responseData.translatedText,
      detectedLanguage: null,
    });

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
