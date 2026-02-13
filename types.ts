
export enum MarketType {
  ASHRE = 'A股 (巨潮资讯)',
  HKEX = '港股 (披露易)',
  US = '美股 (SEC EDGAR)'
}

export interface StockInfo {
  ticker: string;
  name: string;
  market: MarketType;
}

export interface DisclosureFile {
  id: string;
  title: string;
  publishDate: string;
  type: string;
  fileSize?: string;
  downloadUrl: string;
  source: string;
}

export interface SearchState {
  query: string;
  isSearching: boolean;
  error: string | null;
  results: DisclosureFile[];
  stockInfo: StockInfo | null;
}
