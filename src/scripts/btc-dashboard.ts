/**
 * BTC Signal Tracker Dashboard
 * Port of Python btc-signal-tracker to client-side TypeScript + Chart.js
 */
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(...registerables, annotationPlugin);

// ─── Types ───────────────────────────────────────────────────────────

interface PriceData {
  price: number;
  change_24h: number;
}

interface KlineData {
  closes: number[];
  timestamps: number[];
  dates?: string[];
}

interface RSIResult {
  current: number;
  values: number[];
}

interface MayerResult {
  value: number;
  sma_200: number;
  price: number;
}

interface MA200WResult {
  value: number;
  ma_200w: number;
  price: number;
  rolling_ma: number[];
}

interface MVRVData {
  values: number[];
  dates: string[];
  current: number;
}

interface FearGreedData {
  values: number[];
  dates: string[];
  current: number;
  classification: string;
}

interface SignalResult {
  signal: string;
  score: number;
}

interface IndicatorSignal {
  value: number | null;
  signal: string;
  score: number;
  label: string;
  color: string;
  [key: string]: any;
}

interface AllSignals {
  [key: string]: IndicatorSignal;
}

interface AllData {
  price: PriceData | null;
  daily_closes: KlineData | null;
  weekly_closes: KlineData | null;
  monthly_closes: KlineData | null;
  mvrv: MVRVData | null;
  fear_greed: FearGreedData | null;
  btc_xau_weekly: KlineData | null;
  btc_xau_monthly: KlineData | null;
}

// ─── Labels & i18n ──────────────────────────────────────────────────

interface DashboardLabels {
  title: string;
  subtitle: string;
  loading: string;
  loadingData: string;
  lastUpdate: string;
  footer: string;
  howCalculated: string;
  explanationText: string;
  currentBreakdown: string;
  chooseIndicators: string;
  score: string;
  indicator: string;
  value: string;
  signalLabel: string;
  consolidated: string;
  signalPrefix: string;
  scorePrefix: string;
  buyStrong: string;
  buy: string;
  neutral: string;
  sell: string;
  sellStrong: string;
  overbought: string;
  oversold: string;
  current: string;
  weeklyPrice: string;
  close: string;
  cardTitles: Record<string, string>;
  detailTitles: Record<string, string>;
  detailSubtitles: Record<string, string>;
}

const LABELS_PT: DashboardLabels = {
  title: 'BTC SIGNAL TRACKER',
  subtitle: 'Sinais de compra e venda baseados em indicadores on-chain e de mercado',
  loading: 'Carregando',
  loadingData: 'Carregando dados...',
  lastUpdate: 'Ultima atualizacao',
  footer: 'BTC Signal Tracker | Dados atualizados a cada 5 minutos',
  howCalculated: 'Como o sinal consolidado e calculado',
  explanationText: 'Cada indicador gera um score individual de -2 (venda forte) a +2 (compra forte). O score consolidado e a media dos scores dos indicadores selecionados.',
  currentBreakdown: 'Detalhamento atual',
  chooseIndicators: 'Escolha quais indicadores usar no calculo',
  score: 'Score',
  indicator: 'Indicador',
  value: 'Valor',
  signalLabel: 'Sinal',
  consolidated: 'CONSOLIDADO',
  signalPrefix: 'SINAL',
  scorePrefix: 'score',
  buyStrong: 'COMPRA FORTE',
  buy: 'COMPRA',
  neutral: 'NEUTRO',
  sell: 'VENDA',
  sellStrong: 'VENDA FORTE',
  overbought: 'Sobrecomprado (70)',
  oversold: 'Sobrevendido (30)',
  current: 'Atual',
  weeklyPrice: 'Preco Semanal BTC',
  close: 'Fechar',
  cardTitles: {
    mayer_multiple: 'Mayer Multiple',
    '200w_ma_ratio': '200W MA Ratio',
    mvrv: 'MVRV Ratio',
    fear_greed: 'Fear & Greed',
    rsi_weekly: 'RSI Semanal BTC/USD',
    rsi_monthly: 'RSI Mensal BTC/USD',
    rsi_xau_weekly: 'RSI Semanal BTC/XAU',
    rsi_xau_monthly: 'RSI Mensal BTC/XAU',
  },
  detailTitles: {
    mayer_multiple: 'Mayer Multiple',
    '200w_ma_ratio': 'Preco BTC vs 200-Week Moving Average',
    mvrv: 'MVRV Ratio',
    fear_greed: 'Fear & Greed Index',
    rsi_weekly: 'RSI Semanal BTC/USD (14 periodos)',
    rsi_monthly: 'RSI Mensal BTC/USD (14 periodos)',
    rsi_xau_weekly: 'RSI Semanal BTC/XAU (14 periodos)',
    rsi_xau_monthly: 'RSI Mensal BTC/XAU (14 periodos)',
  },
  detailSubtitles: {
    mayer_multiple: 'Valor atual: {value} | SMA 200d: ${sma}',
    '200w_ma_ratio': 'Ratio atual: {value} | 200W MA: ${ma}',
  },
};

const LABELS_EN: DashboardLabels = {
  title: 'BTC SIGNAL TRACKER',
  subtitle: 'Buy and sell signals based on on-chain and market indicators',
  loading: 'Loading',
  loadingData: 'Loading data...',
  lastUpdate: 'Last update',
  footer: 'BTC Signal Tracker | Data refreshed every 5 minutes',
  howCalculated: 'How the consolidated signal is calculated',
  explanationText: 'Each indicator generates an individual score from -2 (strong sell) to +2 (strong buy). The consolidated score is the average of the selected indicators scores.',
  currentBreakdown: 'Current breakdown',
  chooseIndicators: 'Choose which indicators to use in the calculation',
  score: 'Score',
  indicator: 'Indicator',
  value: 'Value',
  signalLabel: 'Signal',
  consolidated: 'CONSOLIDATED',
  signalPrefix: 'SIGNAL',
  scorePrefix: 'score',
  buyStrong: 'STRONG BUY',
  buy: 'BUY',
  neutral: 'NEUTRAL',
  sell: 'SELL',
  sellStrong: 'STRONG SELL',
  overbought: 'Overbought (70)',
  oversold: 'Oversold (30)',
  current: 'Current',
  weeklyPrice: 'BTC Weekly Price',
  close: 'Close',
  cardTitles: {
    mayer_multiple: 'Mayer Multiple',
    '200w_ma_ratio': '200W MA Ratio',
    mvrv: 'MVRV Ratio',
    fear_greed: 'Fear & Greed',
    rsi_weekly: 'Weekly RSI BTC/USD',
    rsi_monthly: 'Monthly RSI BTC/USD',
    rsi_xau_weekly: 'Weekly RSI BTC/XAU',
    rsi_xau_monthly: 'Monthly RSI BTC/XAU',
  },
  detailTitles: {
    mayer_multiple: 'Mayer Multiple',
    '200w_ma_ratio': 'BTC Price vs 200-Week Moving Average',
    mvrv: 'MVRV Ratio',
    fear_greed: 'Fear & Greed Index',
    rsi_weekly: 'Weekly RSI BTC/USD (14 periods)',
    rsi_monthly: 'Monthly RSI BTC/USD (14 periods)',
    rsi_xau_weekly: 'Weekly RSI BTC/XAU (14 periods)',
    rsi_xau_monthly: 'Monthly RSI BTC/XAU (14 periods)',
  },
  detailSubtitles: {
    mayer_multiple: 'Current value: {value} | SMA 200d: ${sma}',
    '200w_ma_ratio': 'Current ratio: {value} | 200W MA: ${ma}',
  },
};

// ─── Constants ──────────────────────────────────────────────────────

const CARD_IDS = [
  'mayer_multiple', '200w_ma_ratio', 'mvrv', 'fear_greed',
  'rsi_weekly', 'rsi_monthly', 'rsi_xau_weekly', 'rsi_xau_monthly',
];

const SIGNAL_LABELS: Record<string, Record<string, string>> = {
  pt: {
    compra_forte: 'COMPRA FORTE',
    compra: 'COMPRA',
    neutro: 'NEUTRO',
    venda: 'VENDA',
    venda_forte: 'VENDA FORTE',
  },
  en: {
    compra_forte: 'STRONG BUY',
    compra: 'BUY',
    neutro: 'NEUTRAL',
    venda: 'SELL',
    venda_forte: 'STRONG SELL',
  },
};

const SIGNAL_COLORS: Record<string, string> = {
  compra_forte: '#00C853',
  compra: '#69F0AE',
  neutro: '#FFD600',
  venda: '#FF6D00',
  venda_forte: '#FF1744',
};

// ─── Fetchers ───────────────────────────────────────────────────────

async function getBtcPrice(): Promise<PriceData | null> {
  try {
    const resp = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
    const data = await resp.json();
    return {
      price: parseFloat(data.lastPrice),
      change_24h: parseFloat(data.priceChangePercent),
    };
  } catch {
    return null;
  }
}

async function getKlines(symbol: string, interval: string, limit: number): Promise<KlineData | null> {
  try {
    const resp = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    const data = await resp.json();
    const closes = data.map((c: any[]) => parseFloat(c[4]));
    const timestamps = data.map((c: any[]) => c[0] as number);
    const dates = timestamps.map((ts: number) => {
      const d = new Date(ts);
      if (interval === '1M') {
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      }
      return d.toISOString().slice(0, 10);
    });
    return { closes, timestamps, dates };
  } catch {
    return null;
  }
}

async function getMvrv(): Promise<MVRVData | null> {
  try {
    let url: string | null = 'https://community-api.coinmetrics.io/v4/timeseries/asset-metrics';
    let params: Record<string, string> | null = {
      assets: 'btc',
      metrics: 'CapMVRVCur',
      frequency: '1d',
      start_time: '2014-01-01',
      page_size: '10000',
    };
    const allValues: number[] = [];
    const allDates: string[] = [];

    while (url) {
      const queryStr = params ? '?' + new URLSearchParams(params).toString() : '';
      const resp = await fetch(url + queryStr);
      const data = await resp.json();
      const series = data.data || [];
      if (!series.length) break;
      for (const entry of series) {
        if (entry.CapMVRVCur != null) {
          allValues.push(parseFloat(entry.CapMVRVCur));
          allDates.push(entry.time.slice(0, 10));
        }
      }
      url = data.next_page_url || null;
      params = null;
    }

    if (!allValues.length) return null;
    return { values: allValues, dates: allDates, current: allValues[allValues.length - 1] };
  } catch {
    return null;
  }
}

async function getFearGreed(): Promise<FearGreedData | null> {
  try {
    const resp = await fetch('https://api.alternative.me/fng/?limit=0');
    const data = await resp.json();
    const entries = data.data || [];
    if (!entries.length) return null;
    const values: number[] = [];
    const dates: string[] = [];
    for (let i = entries.length - 1; i >= 0; i--) {
      values.push(parseInt(entries[i].value));
      dates.push(new Date(parseInt(entries[i].timestamp) * 1000).toISOString().slice(0, 10));
    }
    return {
      values,
      dates,
      current: values[values.length - 1],
      classification: entries[0].value_classification || '',
    };
  } catch {
    return null;
  }
}

function calcBtcXauRatio(btcData: KlineData | null, paxgData: KlineData | null): KlineData | null {
  if (!btcData || !paxgData) return null;
  const btcMap = new Map<number, number>();
  btcData.timestamps.forEach((ts, i) => btcMap.set(ts, btcData.closes[i]));
  const paxgMap = new Map<number, number>();
  paxgData.timestamps.forEach((ts, i) => paxgMap.set(ts, paxgData.closes[i]));

  const commonTs = btcData.timestamps.filter(ts => paxgMap.has(ts)).sort((a, b) => a - b);
  if (!commonTs.length) return null;

  const ratios = commonTs.map(ts => btcMap.get(ts)! / paxgMap.get(ts)!);
  const dates = commonTs.map(ts => new Date(ts).toISOString().slice(0, 10));
  return { closes: ratios, timestamps: commonTs, dates };
}

async function fetchAllData(): Promise<AllData> {
  const [price, daily, weekly, monthly, mvrv, fng, paxgW, paxgM, btcWRaw, btcMRaw] =
    await Promise.all([
      getBtcPrice(),
      getKlines('BTCUSDT', '1d', 200),
      getKlines('BTCUSDT', '1w', 1000),
      getKlines('BTCUSDT', '1M', 200),
      getMvrv(),
      getFearGreed(),
      getKlines('PAXGUSDT', '1w', 1000),
      getKlines('PAXGUSDT', '1M', 200),
      getKlines('BTCUSDT', '1w', 1000),
      getKlines('BTCUSDT', '1M', 200),
    ]);

  return {
    price,
    daily_closes: daily,
    weekly_closes: weekly,
    monthly_closes: monthly,
    mvrv,
    fear_greed: fng,
    btc_xau_weekly: calcBtcXauRatio(btcWRaw, paxgW),
    btc_xau_monthly: calcBtcXauRatio(btcMRaw, paxgM),
  };
}

// ─── Signal Calculations ────────────────────────────────────────────

function calcRSI(closes: number[], period = 14): RSIResult | null {
  if (!closes || closes.length < period + 1) return null;
  const deltas: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    deltas.push(closes[i] - closes[i - 1]);
  }
  const gains = deltas.map(d => (d > 0 ? d : 0));
  const losses = deltas.map(d => (d < 0 ? -d : 0));

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const rsiValues: number[] = [];
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    if (avgLoss === 0) {
      rsiValues.push(100.0);
    } else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - 100 / (1 + rs));
    }
  }

  if (!rsiValues.length) {
    if (avgLoss === 0) return { current: 100.0, values: [100.0] };
    const rs = avgGain / avgLoss;
    const val = 100 - 100 / (1 + rs);
    return { current: val, values: [val] };
  }

  return { current: rsiValues[rsiValues.length - 1], values: rsiValues };
}

function calcMayerMultiple(dailyCloses: KlineData | null): MayerResult | null {
  if (!dailyCloses || dailyCloses.closes.length < 200) return null;
  const closes = dailyCloses.closes;
  const sma200 = closes.reduce((a, b) => a + b, 0) / closes.length;
  const currentPrice = closes[closes.length - 1];
  return {
    value: Math.round((currentPrice / sma200) * 1000) / 1000,
    sma_200: Math.round(sma200 * 100) / 100,
    price: Math.round(currentPrice * 100) / 100,
  };
}

function calc200wMaRatio(priceData: PriceData | null, weeklyCloses: KlineData | null): MA200WResult | null {
  if (!priceData || !weeklyCloses || weeklyCloses.closes.length < 200) return null;
  const closes = weeklyCloses.closes;
  const last200 = closes.slice(-200);
  const ma200w = last200.reduce((a, b) => a + b, 0) / 200;
  const currentPrice = priceData.price;

  const rollingMa: number[] = [];
  for (let i = 199; i < closes.length; i++) {
    const window = closes.slice(i - 199, i + 1);
    rollingMa.push(Math.round((window.reduce((a, b) => a + b, 0) / 200) * 100) / 100);
  }

  return {
    value: Math.round((currentPrice / ma200w) * 1000) / 1000,
    ma_200w: Math.round(ma200w * 100) / 100,
    price: Math.round(currentPrice * 100) / 100,
    rolling_ma: rollingMa,
  };
}

function signalMayer(value: number | null): SignalResult {
  if (value == null) return { signal: 'neutro', score: 0 };
  if (value < 0.8) return { signal: 'compra_forte', score: 2 };
  if (value < 1.0) return { signal: 'compra', score: 1 };
  if (value < 1.5) return { signal: 'neutro', score: 0 };
  if (value <= 2.4) return { signal: 'venda', score: -1 };
  return { signal: 'venda_forte', score: -2 };
}

function signal200wMa(value: number | null): SignalResult {
  if (value == null) return { signal: 'neutro', score: 0 };
  if (value < 0.8) return { signal: 'compra_forte', score: 2 };
  if (value < 1.0) return { signal: 'compra', score: 1 };
  if (value < 1.5) return { signal: 'neutro', score: 0 };
  if (value <= 3.0) return { signal: 'venda', score: -1 };
  return { signal: 'venda_forte', score: -2 };
}

function signalMvrv(value: number | null): SignalResult {
  if (value == null) return { signal: 'neutro', score: 0 };
  if (value < 1.0) return { signal: 'compra_forte', score: 2 };
  if (value < 1.5) return { signal: 'compra', score: 1 };
  if (value < 2.5) return { signal: 'neutro', score: 0 };
  if (value <= 3.5) return { signal: 'venda', score: -1 };
  return { signal: 'venda_forte', score: -2 };
}

function signalFearGreed(value: number | null): SignalResult {
  if (value == null) return { signal: 'neutro', score: 0 };
  if (value <= 10) return { signal: 'compra_forte', score: 2 };
  if (value <= 25) return { signal: 'compra', score: 1 };
  if (value <= 74) return { signal: 'neutro', score: 0 };
  if (value <= 90) return { signal: 'venda', score: -1 };
  return { signal: 'venda_forte', score: -2 };
}

function signalRSI(value: number | null): SignalResult {
  if (value == null) return { signal: 'neutro', score: 0 };
  if (value < 30) return { signal: 'compra_forte', score: 2 };
  if (value < 40) return { signal: 'compra', score: 1 };
  if (value < 60) return { signal: 'neutro', score: 0 };
  if (value < 70) return { signal: 'venda', score: -1 };
  return { signal: 'venda_forte', score: -2 };
}

function fngColor(value: number | null): string {
  if (value == null) return '#8b949e';
  if (value <= 25) {
    const r = 255;
    const g = Math.floor(value * 4.0);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}00`;
  } else if (value <= 50) {
    const ratio = (value - 25) / 25.0;
    const r = Math.floor(255 - ratio * 55);
    const g = Math.floor(100 + ratio * 116);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}00`;
  } else if (value <= 75) {
    const ratio = (value - 50) / 25.0;
    const r = Math.floor(200 - ratio * 120);
    const g = Math.floor(216 - ratio * 16);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}00`;
  } else {
    const ratio = (value - 75) / 25.0;
    const r = Math.floor(80 - ratio * 80);
    const g = Math.floor(200 + ratio * 55);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}00`;
  }
}

function computeAllSignals(allData: AllData, lang: string): AllSignals {
  const labels = SIGNAL_LABELS[lang] || SIGNAL_LABELS.pt;
  const mayer = calcMayerMultiple(allData.daily_closes);
  const ratio200w = calc200wMaRatio(allData.price, allData.weekly_closes);

  const rsiWeekly = allData.weekly_closes ? calcRSI(allData.weekly_closes.closes) : null;
  const rsiMonthly = allData.monthly_closes ? calcRSI(allData.monthly_closes.closes) : null;
  const rsiXauWeekly = allData.btc_xau_weekly ? calcRSI(allData.btc_xau_weekly.closes) : null;
  const rsiXauMonthly = allData.btc_xau_monthly ? calcRSI(allData.btc_xau_monthly.closes) : null;

  const mayerVal = mayer ? mayer.value : null;
  const ratioVal = ratio200w ? ratio200w.value : null;
  const mvrvVal = allData.mvrv ? allData.mvrv.current : null;
  const fngVal = allData.fear_greed ? allData.fear_greed.current : null;
  const rsiWVal = rsiWeekly ? Math.round(rsiWeekly.current * 10) / 10 : null;
  const rsiMVal = rsiMonthly ? Math.round(rsiMonthly.current * 10) / 10 : null;
  const rsiXauWVal = rsiXauWeekly ? Math.round(rsiXauWeekly.current * 10) / 10 : null;
  const rsiXauMVal = rsiXauMonthly ? Math.round(rsiXauMonthly.current * 10) / 10 : null;

  const sigMayer = signalMayer(mayerVal);
  const sig200w = signal200wMa(ratioVal);
  const sigMvrv = signalMvrv(mvrvVal);
  const sigFng = signalFearGreed(fngVal);
  const sigRsiW = signalRSI(rsiWVal);
  const sigRsiM = signalRSI(rsiMVal);
  const sigRsiXauW = signalRSI(rsiXauWVal);
  const sigRsiXauM = signalRSI(rsiXauMVal);

  const scores: number[] = [];
  const pairs: [number | null, number][] = [
    [mayerVal, sigMayer.score], [ratioVal, sig200w.score],
    [mvrvVal, sigMvrv.score], [fngVal, sigFng.score],
    [rsiWVal, sigRsiW.score], [rsiMVal, sigRsiM.score],
    [rsiXauWVal, sigRsiXauW.score], [rsiXauMVal, sigRsiXauM.score],
  ];
  for (const [val, score] of pairs) {
    if (val != null) scores.push(score);
  }

  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  let consolidated: string;
  if (avgScore >= 1.5) consolidated = 'compra_forte';
  else if (avgScore >= 0.5) consolidated = 'compra';
  else if (avgScore > -0.5) consolidated = 'neutro';
  else if (avgScore > -1.5) consolidated = 'venda';
  else consolidated = 'venda_forte';

  function makeSignal(val: number | null, sig: SignalResult, extra: Record<string, any> = {}): IndicatorSignal {
    return {
      value: val,
      signal: sig.signal,
      score: sig.score,
      label: labels[sig.signal],
      color: SIGNAL_COLORS[sig.signal],
      ...extra,
    };
  }

  return {
    mayer_multiple: makeSignal(mayerVal, sigMayer, { details: mayer }),
    '200w_ma_ratio': makeSignal(ratioVal, sig200w, { details: ratio200w }),
    mvrv: makeSignal(mvrvVal, sigMvrv, { history: allData.mvrv }),
    fear_greed: makeSignal(fngVal, sigFng, {
      dynamic_color: fngColor(fngVal),
      classification: allData.fear_greed?.classification || '',
      history: allData.fear_greed,
    }),
    rsi_weekly: makeSignal(rsiWVal, sigRsiW, { history: rsiWeekly }),
    rsi_monthly: makeSignal(rsiMVal, sigRsiM, { history: rsiMonthly }),
    rsi_xau_weekly: makeSignal(rsiXauWVal, sigRsiXauW, { history: rsiXauWeekly }),
    rsi_xau_monthly: makeSignal(rsiXauMVal, sigRsiXauM, { history: rsiXauMonthly }),
    consolidated: {
      value: null,
      signal: consolidated,
      score: Math.round(avgScore * 100) / 100,
      label: labels[consolidated],
      color: SIGNAL_COLORS[consolidated],
    },
  };
}

// ─── Chart Rendering ────────────────────────────────────────────────

const activeCharts: Map<string, Chart> = new Map();

function destroyChart(id: string) {
  const existing = activeCharts.get(id);
  if (existing) {
    existing.destroy();
    activeCharts.delete(id);
  }
}

function buildRSIChart(canvasId: string, closesData: KlineData | null, signalData: IndicatorSignal, L: DashboardLabels) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;

  const history = signalData.history as RSIResult | null;
  if (!history || !closesData?.dates) return;

  const rsiValues = history.values;
  const dates = closesData.dates || [];
  const offset = dates.length - rsiValues.length;
  const rsiDates = offset > 0 ? dates.slice(offset) : dates;

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: rsiDates,
      datasets: [{
        label: 'RSI',
        data: rsiValues,
        borderColor: '#bb86fc',
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 8,
        tension: 0.1,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: '#8b949e', maxTicksLimit: 12 },
          grid: { color: '#21262d' },
        },
        y: {
          min: 0,
          max: 100,
          ticks: { color: '#8b949e' },
          grid: { color: '#21262d' },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `RSI: ${(ctx.raw as number).toFixed(1)}`,
          },
        },
        annotation: {
          annotations: {
            overbought: {
              type: 'line',
              yMin: 70,
              yMax: 70,
              borderColor: '#f85149',
              borderWidth: 1,
              borderDash: [6, 3],
              label: { content: L.overbought, display: true, position: 'end', color: '#f85149', backgroundColor: 'transparent', font: { size: 11 } },
            },
            oversold: {
              type: 'line',
              yMin: 30,
              yMax: 30,
              borderColor: '#3fb950',
              borderWidth: 1,
              borderDash: [6, 3],
              label: { content: L.oversold, display: true, position: 'end', color: '#3fb950', backgroundColor: 'transparent', font: { size: 11 } },
            },
            overboughtZone: {
              type: 'box',
              yMin: 70,
              yMax: 100,
              backgroundColor: 'rgba(248, 81, 73, 0.05)',
              borderWidth: 0,
            },
            oversoldZone: {
              type: 'box',
              yMin: 0,
              yMax: 30,
              backgroundColor: 'rgba(63, 185, 80, 0.05)',
              borderWidth: 0,
            },
          },
        },
      },
    },
  });
  activeCharts.set(canvasId, chart);
}

function build200wChart(canvasId: string, weeklyCloses: KlineData | null, details: MA200WResult | null, L: DashboardLabels) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas || !weeklyCloses || !details) return;

  const dates = weeklyCloses.dates || [];
  const closes = weeklyCloses.closes;
  const rollingMa = details.rolling_ma;

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: L.weeklyPrice,
          data: closes,
          borderColor: '#f0883e',
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 8,
          tension: 0.1,
          fill: false,
        },
        {
          label: '200W MA',
          data: Array(dates.length - rollingMa.length).fill(null).concat(rollingMa),
          borderColor: '#58a6ff',
          borderWidth: 2,
          borderDash: [6, 3],
          pointRadius: 0,
          pointHitRadius: 8,
          tension: 0.1,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: '#8b949e', maxTicksLimit: 12 },
          grid: { color: '#21262d' },
        },
        y: {
          type: 'logarithmic',
          ticks: {
            color: '#8b949e',
            callback: (val) => '$' + Number(val).toLocaleString(),
          },
          grid: { color: '#21262d' },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: '#8b949e' },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: $${Number(ctx.raw).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          },
        },
      },
    },
  });
  activeCharts.set(canvasId, chart);
}

function buildMVRVChart(canvasId: string, mvrvData: MVRVData | null, L: DashboardLabels) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas || !mvrvData) return;

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: mvrvData.dates,
      datasets: [{
        label: 'MVRV',
        data: mvrvData.values,
        borderColor: '#f0883e',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHitRadius: 8,
        tension: 0.1,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: '#8b949e', maxTicksLimit: 12 },
          grid: { color: '#21262d' },
        },
        y: {
          ticks: { color: '#8b949e' },
          grid: { color: '#21262d' },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `MVRV: ${(ctx.raw as number).toFixed(3)}`,
          },
        },
        annotation: {
          annotations: {
            buyLine: {
              type: 'line',
              yMin: 1.0,
              yMax: 1.0,
              borderColor: '#3fb950',
              borderWidth: 1,
              borderDash: [6, 3],
              label: { content: lang === 'en' ? 'Buy' : 'Compra', display: true, position: 'end', color: '#3fb950', backgroundColor: 'transparent', font: { size: 11 } },
            },
            sellLine: {
              type: 'line',
              yMin: 3.5,
              yMax: 3.5,
              borderColor: '#f85149',
              borderWidth: 1,
              borderDash: [6, 3],
              label: { content: lang === 'en' ? 'Sell' : 'Venda', display: true, position: 'end', color: '#f85149', backgroundColor: 'transparent', font: { size: 11 } },
            },
          },
        },
      },
    },
  });
  activeCharts.set(canvasId, chart);
}

function buildFearGreedChart(canvasId: string, fngData: FearGreedData | null) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas || !fngData) return;

  const colors = fngData.values.map(v => fngColor(v));

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: fngData.dates,
      datasets: [{
        label: 'Fear & Greed',
        data: fngData.values,
        backgroundColor: colors,
        borderWidth: 0,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: '#8b949e', maxTicksLimit: 12 },
          grid: { display: false },
        },
        y: {
          min: 0,
          max: 100,
          ticks: { color: '#8b949e' },
          grid: { color: '#21262d' },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Fear & Greed: ${ctx.raw}`,
          },
        },
      },
    },
  });
  activeCharts.set(canvasId, chart);
}

// ─── Dashboard Controller ───────────────────────────────────────────

let lang = 'pt';
let L: DashboardLabels;
let allSignals: AllSignals | null = null;
let rawData: AllData | null = null;
let selectedCard = '';
let selectedIndicators: Set<string> = new Set(CARD_IDS);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

function formatValue(cardId: string, value: number | null): string {
  if (value == null) return 'N/A';
  if (cardId === 'fear_greed') return String(value);
  if (cardId.includes('rsi')) return value.toFixed(1);
  return value.toFixed(3);
}

function updatePriceBanner() {
  const el = document.getElementById('bd-price-banner');
  if (!el || !rawData?.price) {
    if (el) el.innerHTML = `<span class="bd-price-value">${L.loadingData}</span>`;
    return;
  }
  const { price, change_24h } = rawData.price;
  const sign = change_24h >= 0 ? '+' : '';
  const cls = change_24h >= 0 ? 'bd-price-positive' : 'bd-price-negative';
  el.innerHTML = `<span class="bd-price-value">$ ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    <span class="bd-price-change ${cls}">${sign}${change_24h.toFixed(2)}%</span>`;
}

function updateConsolidatedSignal() {
  const el = document.getElementById('bd-consolidated');
  if (!el || !allSignals) return;

  const scores: number[] = [];
  for (const cid of CARD_IDS) {
    if (selectedIndicators.has(cid) && allSignals[cid].value != null) {
      scores.push(allSignals[cid].score);
    }
  }

  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  let consolidated: string;
  if (avgScore >= 1.5) consolidated = 'compra_forte';
  else if (avgScore >= 0.5) consolidated = 'compra';
  else if (avgScore > -0.5) consolidated = 'neutro';
  else if (avgScore > -1.5) consolidated = 'venda';
  else consolidated = 'venda_forte';

  const labels = SIGNAL_LABELS[lang] || SIGNAL_LABELS.pt;
  const label = labels[consolidated];
  const color = SIGNAL_COLORS[consolidated];
  const scoreRounded = Math.round(avgScore * 100) / 100;

  el.textContent = `${L.signalPrefix}: ${label} (${L.scorePrefix}: ${scoreRounded})`;
  el.style.backgroundColor = color + '22';
  el.style.color = color;
  el.style.border = `2px solid ${color}`;
}

function updateCards() {
  if (!allSignals) return;
  for (const cid of CARD_IDS) {
    const sig = allSignals[cid];
    const valueEl = document.getElementById(`bd-card-value-${cid}`);
    const signalEl = document.getElementById(`bd-card-signal-${cid}`);
    if (valueEl) {
      valueEl.textContent = formatValue(cid, sig.value);
      if (cid === 'fear_greed') {
        valueEl.style.color = sig.dynamic_color || '#e6edf3';
      }
    }
    if (signalEl) {
      signalEl.textContent = sig.label;
      signalEl.style.backgroundColor = sig.color + '33';
      signalEl.style.color = sig.color;
    }
  }
}

function updateBreakdownTable() {
  const container = document.getElementById('bd-breakdown');
  if (!container || !allSignals) return;

  const labels = SIGNAL_LABELS[lang] || SIGNAL_LABELS.pt;
  let html = `<table class="bd-breakdown-table">
    <thead><tr><th></th><th>${L.indicator}</th><th>${L.value}</th><th>${L.signalLabel}</th><th>${L.score}</th></tr></thead><tbody>`;

  const scores: number[] = [];
  for (const cid of CARD_IDS) {
    const sig = allSignals[cid];
    const isSelected = selectedIndicators.has(cid);
    const cls = isSelected ? '' : ' class="bd-row-dimmed"';
    const check = isSelected ? '\u2713' : '-';
    const valStr = formatValue(cid, sig.value);

    html += `<tr${cls}>
      <td style="width:30px;text-align:center">${check}</td>
      <td>${L.cardTitles[cid]}</td>
      <td>${valStr}</td>
      <td style="color:${sig.color}">${sig.label}</td>
      <td>${sig.score > 0 ? '+' : ''}${sig.score}</td>
    </tr>`;

    if (isSelected && sig.value != null) scores.push(sig.score);
  }

  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  let consolidated: string;
  if (avgScore >= 1.5) consolidated = 'compra_forte';
  else if (avgScore >= 0.5) consolidated = 'compra';
  else if (avgScore > -0.5) consolidated = 'neutro';
  else if (avgScore > -1.5) consolidated = 'venda';
  else consolidated = 'venda_forte';

  const color = SIGNAL_COLORS[consolidated];
  const scoreRounded = Math.round(avgScore * 100) / 100;

  html += `</tbody><tfoot><tr style="border-top:2px solid ${color}">
    <td></td>
    <td style="font-weight:700;color:${color}">${L.consolidated}</td>
    <td></td>
    <td style="font-weight:700;color:${color}">${labels[consolidated]}</td>
    <td style="font-weight:700;color:${color}">${scoreRounded}</td>
  </tr></tfoot></table>`;

  container.innerHTML = html;
}

function showDetail(cardId: string) {
  if (!allSignals || !rawData) return;
  const panel = document.getElementById('bd-detail');
  const content = document.getElementById('bd-detail-content');
  if (!panel || !content) return;

  // Remove active class from all cards, add to selected
  for (const cid of CARD_IDS) {
    const cardEl = document.getElementById(`bd-card-${cid}`);
    if (cardEl) cardEl.classList.toggle('active', cid === cardId);
  }

  if (!cardId) {
    panel.classList.remove('open');
    return;
  }

  const sig = allSignals[cardId];
  let innerHtml = `<button class="bd-close-btn" id="bd-close-detail">\u2715</button>
    <h3>${L.detailTitles[cardId]}</h3>`;

  if (cardId === 'mayer_multiple') {
    const details = sig.details as MayerResult | null;
    if (details) {
      const sub = L.detailSubtitles.mayer_multiple
        .replace('{value}', String(details.value))
        .replace('{sma}', details.sma_200.toLocaleString(undefined, { minimumFractionDigits: 2 }));
      innerHtml += `<p>${sub}</p>`;
    }
    innerHtml += `<div class="bd-iframe-container">
      <h4>Mayer Multiple (CheckOnChain)</h4>
      <iframe src="https://charts.checkonchain.com/btconchain/pricing/pricing_mayermultiple/pricing_mayermultiple_dark.html" loading="lazy"></iframe>
    </div>`;

  } else if (cardId === '200w_ma_ratio') {
    const details = sig.details as MA200WResult | null;
    if (details) {
      const sub = L.detailSubtitles['200w_ma_ratio']
        .replace('{value}', String(details.value))
        .replace('{ma}', details.ma_200w.toLocaleString(undefined, { minimumFractionDigits: 2 }));
      innerHtml += `<p>${sub}</p>`;
    }
    innerHtml += `<div class="bd-chart-container"><canvas id="bd-chart-200w"></canvas></div>`;

  } else if (cardId === 'mvrv') {
    innerHtml += `<div class="bd-chart-container"><canvas id="bd-chart-mvrv"></canvas></div>`;
    innerHtml += `<div class="bd-iframe-container" style="margin-top:16px">
      <h4>MVRV (CheckOnChain)</h4>
      <iframe src="https://charts.checkonchain.com/btconchain/unrealised/mvrv_aviv_1/mvrv_aviv_1_dark.html" loading="lazy"></iframe>
    </div>`;

  } else if (cardId === 'fear_greed') {
    innerHtml += `<p style="color:${sig.dynamic_color};font-weight:600">${L.current}: ${sig.value} - ${sig.classification}</p>`;
    innerHtml += `<div class="bd-chart-container"><canvas id="bd-chart-fng"></canvas></div>`;

  } else if (cardId.includes('rsi')) {
    innerHtml += `<p>RSI ${L.current.toLowerCase()}: ${sig.value}</p>`;
    innerHtml += `<div class="bd-chart-container"><canvas id="bd-chart-rsi"></canvas></div>`;
  }

  content.innerHTML = innerHtml;
  panel.classList.add('open');

  // Render charts after DOM update
  requestAnimationFrame(() => {
    if (cardId === '200w_ma_ratio') {
      build200wChart('bd-chart-200w', rawData!.weekly_closes, sig.details as MA200WResult, L);
    } else if (cardId === 'mvrv') {
      buildMVRVChart('bd-chart-mvrv', rawData!.mvrv, L);
    } else if (cardId === 'fear_greed') {
      buildFearGreedChart('bd-chart-fng', rawData!.fear_greed);
    } else if (cardId === 'rsi_weekly') {
      buildRSIChart('bd-chart-rsi', rawData!.weekly_closes, sig, L);
    } else if (cardId === 'rsi_monthly') {
      buildRSIChart('bd-chart-rsi', rawData!.monthly_closes, sig, L);
    } else if (cardId === 'rsi_xau_weekly') {
      buildRSIChart('bd-chart-rsi', rawData!.btc_xau_weekly, sig, L);
    } else if (cardId === 'rsi_xau_monthly') {
      buildRSIChart('bd-chart-rsi', rawData!.btc_xau_monthly, sig, L);
    }

    // Bind close button
    const closeBtn = document.getElementById('bd-close-detail');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        selectedCard = '';
        showDetail('');
      });
    }
  });
}

function bindEvents() {
  // Card clicks
  for (const cid of CARD_IDS) {
    const cardEl = document.getElementById(`bd-card-${cid}`);
    if (cardEl) {
      cardEl.addEventListener('click', () => {
        if (selectedCard === cid) {
          selectedCard = '';
          showDetail('');
        } else {
          selectedCard = cid;
          showDetail(cid);
        }
      });
    }
  }

  // Help button
  const helpBtn = document.getElementById('bd-help-btn');
  const explanationPanel = document.getElementById('bd-explanation');
  if (helpBtn && explanationPanel) {
    helpBtn.addEventListener('click', () => {
      explanationPanel.classList.toggle('open');
    });
  }

  // Checkboxes
  const checkboxContainer = document.getElementById('bd-checklist');
  if (checkboxContainer) {
    checkboxContainer.addEventListener('change', () => {
      selectedIndicators.clear();
      const boxes = checkboxContainer.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      boxes.forEach(box => {
        if (box.checked) selectedIndicators.add(box.value);
      });
      updateConsolidatedSignal();
      updateBreakdownTable();
    });
  }
}

async function loadData() {
  const loadingEl = document.getElementById('bd-loading');
  if (loadingEl) loadingEl.style.display = 'block';

  try {
    rawData = await fetchAllData();
    allSignals = computeAllSignals(rawData, lang);

    updatePriceBanner();
    updateConsolidatedSignal();
    updateCards();
    updateBreakdownTable();

    // Update timestamp
    const tsEl = document.getElementById('bd-last-update');
    if (tsEl) {
      const now = new Date();
      tsEl.textContent = `${L.lastUpdate}: ${now.toLocaleTimeString()}`;
    }

    // Re-render open detail panel
    if (selectedCard) {
      showDetail(selectedCard);
    }
  } catch (e) {
    console.error('Failed to load BTC dashboard data:', e);
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

let initialized = false;

export function initDashboard(locale: string) {
  if (initialized) return;
  initialized = true;

  lang = locale;
  L = locale === 'en' ? LABELS_EN : LABELS_PT;

  bindEvents();
  loadData();

  // Auto-refresh every 5 minutes
  refreshTimer = setInterval(loadData, 5 * 60 * 1000);
}
