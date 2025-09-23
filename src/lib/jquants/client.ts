// J-Quants API クライアント

export interface JQuantsConfig {
  baseUrl: string;
  email: string;
  password: string;
  refreshToken?: string;
}

export interface JQuantsTokens {
  refreshToken: string;
  idToken: string;
  expiresAt: number;
}

export interface JQuantsStockPrice {
  Date: string;
  Code: string;
  Open: number | null;
  High: number | null;
  Low: number | null;
  Close: number | null;
  Volume: number | null;
  TurnoverValue: number | null;
  AdjustmentFactor: number;
  AdjustmentOpen: number | null;
  AdjustmentHigh: number | null;
  AdjustmentLow: number | null;
  AdjustmentClose: number | null;
  AdjustmentVolume: number | null;
}

export interface JQuantsSymbolInfo {
  Date: string;
  Code: string;
  CompanyName: string;
  CompanyNameEnglish: string;
  Sector17Code: string;
  Sector17CodeName: string;
  Sector33Code: string;
  Sector33CodeName: string;
  ScaleCategory: string;
  MarketCode: string;
  MarketCodeName: string;
  MarginCode?: string;
  MarginCodeName?: string;
}

export class JQuantsClient {
  private config: JQuantsConfig;
  private tokens: JQuantsTokens | null = null;

  constructor(config: JQuantsConfig) {
    this.config = config;
  }

  // リフレッシュトークンを取得
  async getRefreshToken(): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/v1/token/auth_user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mailaddress: this.config.email,
        password: this.config.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get refresh token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.refreshToken;
  }

  // IDトークンを取得
  async getIdToken(refreshToken?: string): Promise<string> {
    const token = refreshToken || this.config.refreshToken;
    if (!token) {
      throw new Error('Refresh token is required');
    }

    const response = await fetch(
      `${this.config.baseUrl}/v1/token/auth_refresh?refreshtoken=${token}`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get ID token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.idToken;
  }

  // 認証済みIDトークンを取得（キャッシュ機能付き）
  async getValidIdToken(): Promise<string> {
    const now = Date.now();

    // 既存のトークンが有効かチェック
    if (this.tokens && this.tokens.expiresAt > now + 60000) { // 1分のマージン
      return this.tokens.idToken;
    }

    // リフレッシュトークンを取得（必要に応じて）
    let refreshToken = this.config.refreshToken;
    if (!refreshToken) {
      refreshToken = await this.getRefreshToken();
    }

    // IDトークンを取得
    const idToken = await this.getIdToken(refreshToken);

    // トークンをキャッシュ（24時間有効）
    this.tokens = {
      refreshToken,
      idToken,
      expiresAt: now + 23 * 60 * 60 * 1000, // 23時間
    };

    return idToken;
  }

  // 株価データを取得
  async getStockPrices(params: {
    code?: string;
    date?: string;
    from?: string;
    to?: string;
    paginationKey?: string;
  }): Promise<{
    daily_quotes: JQuantsStockPrice[];
    pagination_key?: string;
  }> {
    const idToken = await this.getValidIdToken();
    
    const searchParams = new URLSearchParams();
    if (params.code) searchParams.append('code', params.code);
    if (params.date) searchParams.append('date', params.date);
    if (params.from) searchParams.append('from', params.from);
    if (params.to) searchParams.append('to', params.to);
    if (params.paginationKey) searchParams.append('pagination_key', params.paginationKey);

    const response = await fetch(
      `${this.config.baseUrl}/v1/prices/daily_quotes?${searchParams}`,
      {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get stock prices: ${response.statusText}`);
    }

    return await response.json();
  }

  // 銘柄情報を取得
  async getSymbolInfo(params: {
    code?: string;
    date?: string;
  } = {}): Promise<{
    info: JQuantsSymbolInfo[];
  }> {
    const idToken = await this.getValidIdToken();
    
    const searchParams = new URLSearchParams();
    if (params.code) searchParams.append('code', params.code);
    if (params.date) searchParams.append('date', params.date);

    const response = await fetch(
      `${this.config.baseUrl}/v1/listed/info?${searchParams}`,
      {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get symbol info: ${response.statusText}`);
    }

    return await response.json();
  }

  // 全銘柄の株価データを取得（ページング対応）
  async getAllStockPrices(date: string): Promise<JQuantsStockPrice[]> {
    const allPrices: JQuantsStockPrice[] = [];
    let paginationKey: string | undefined;

    do {
      const result = await this.getStockPrices({
        date,
        paginationKey,
      });

      allPrices.push(...result.daily_quotes);
      paginationKey = result.pagination_key;

      // レート制限を考慮して少し待機
      if (paginationKey) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } while (paginationKey);

    return allPrices;
  }

  // 全銘柄情報を取得
  async getAllSymbolInfo(date?: string): Promise<JQuantsSymbolInfo[]> {
    const result = await this.getSymbolInfo({ date });
    return result.info;
  }
}

// サーバーサイド専用のクライアントインスタンス
export function createJQuantsClient(): JQuantsClient {
  const config: JQuantsConfig = {
    baseUrl: process.env.JQUANTS_API_BASE_URL || 'https://api.jquants.com',
    email: process.env.JQUANTS_USER || '',
    password: process.env.JQUANTS_PASSWORD || '',
    refreshToken: process.env.JQUANTS_REFRESH_TOKEN,
  };

  if (!config.email || !config.password) {
    throw new Error('J-Quants credentials are not configured');
  }

  return new JQuantsClient(config);
}
