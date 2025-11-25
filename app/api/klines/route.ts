import { NextResponse } from 'next/server';

const DEFAULT_SYMBOL = 'BTCUSDT';
const DEFAULT_INTERVAL = '1h';
const MAX_LIMIT = 1000;

function normalizeNumber(value: string | number) {
  return Number.parseFloat(typeof value === 'string' ? value : value.toString());
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get('symbol') || DEFAULT_SYMBOL).toUpperCase();
  const interval = url.searchParams.get('interval') || DEFAULT_INTERVAL;
  const limit = Math.min(Number(url.searchParams.get('limit')) || 500, MAX_LIMIT);

  const endpoint = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: {
        revalidate: interval.includes('m') ? 5 : 30,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Failed to load market data',
          details: await response.text(),
        },
        { status: response.status },
      );
    }

    const raw = (await response.json()) as (number | string)[][];

    const candles = raw.map((entry) => ({
      time: Number(entry[0]) / 1000,
      open: normalizeNumber(entry[1]),
      high: normalizeNumber(entry[2]),
      low: normalizeNumber(entry[3]),
      close: normalizeNumber(entry[4]),
      volume: normalizeNumber(entry[5]),
    }));

    return NextResponse.json({ candles });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Unexpected server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
