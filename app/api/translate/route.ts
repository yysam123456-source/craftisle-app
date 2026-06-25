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

    // MyMemory does NOT support "auto" as a source language.
    // Client-side detection must resolve auto to an actual code before calling this route.
    // Fallback: if we somehow receive "auto", treat it as English.
    const resolvedSource = source === 'auto' ? 'en' : source;

    // MyMemory uses langpair format like zh-CN|en, ja|en, etc.
    const langpair = `${resolvedSource}|${target}`;

    const url = `${MYMEMORY_API_URL}?q=${encodeURIComponent(text)}&langpair=${langpair}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error('MyMemory HTTP error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Translation service unavailable. Please try again.' },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.responseStatus !== 200) {
      console.error('MyMemory API error:', data.responseMessage || data.responseDetails);
      return NextResponse.json(
        { error: data.responseMessage || 'Translation failed. The language pair may not be supported.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      translatedText: data.responseData.translatedText,
      detectedLanguage: data.responseData.detectedLanguage || null,
      match: data.responseData.match || null,
    });

  } catch (error: any) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: error.name === 'TimeoutError' ? 'Translation timed out. Please try again.' : 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
