import { NextRequest, NextResponse } from 'next/server';

// MyMemory Translation API (free, no API key required)
const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';

export async function POST(request: NextRequest) {
  try {
    const { text, source, target } = await request.json();

    if (!text || !target) {
      return NextResponse.json(
        { error: 'Missing required fields: text, target' },
        { status: 400 }
      );
    }

    // MyMemory supports auto-detection with langpair=auto|<target>
    const langpair = source === 'auto' ? `auto|${target}` : `${source}|${target}`;

    const url = `${MYMEMORY_API_URL}?q=${encodeURIComponent(text)}&langpair=${langpair}`;
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      console.error('MyMemory API error:', response.statusText);
      return NextResponse.json(
        { error: 'Translation service unavailable. Please try again.' },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.responseStatus !== 200) {
      console.error('MyMemory API error:', data.responseMessage);
      return NextResponse.json(
        { error: 'Translation failed. The language pair may not be supported.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      translatedText: data.responseData.translatedText,
      detectedLanguage: data.responseData.detectedLanguage || null,
      match: data.responseData.match || null,
    });

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
