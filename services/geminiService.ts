
import { GoogleGenAI, Type } from "@google/genai";
import { MarketType, DisclosureFile, StockInfo } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DISCLOSURE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    stockInfo: {
      type: Type.OBJECT,
      properties: {
        ticker: { type: Type.STRING },
        name: { type: Type.STRING },
        market: { type: Type.STRING, enum: Object.values(MarketType) }
      },
      required: ["ticker", "name", "market"]
    },
    files: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING, description: "Official title in Chinese for CN/HK markets, original for US" },
          publishDate: { type: Type.STRING, description: "Format: YYYY-MM-DD" },
          type: { type: Type.STRING, description: "e.g., 年报, 10-K, 8-K, 临时公告, 通函" },
          fileSize: { type: Type.STRING, nullable: true },
          downloadUrl: { type: Type.STRING, description: "Direct static link to the PDF/HTML" },
          source: { type: Type.STRING, description: "Official source name, e.g., SSE, SZSE, HKEX, SEC" }
        },
        required: ["id", "title", "publishDate", "type", "downloadUrl", "source"]
      }
    }
  },
  required: ["stockInfo", "files"]
};

export const fetchDisclosures = async (query: string): Promise<{ stockInfo: StockInfo, files: DisclosureFile[] }> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `请针对 "${query}" 深度检索官方披露文件，特别是财务报告。

数据源与链接核心要求：
1. 港股 (HKEX)：必须以 https://www.hkexnews.hk (披露易) 为核心搜索源。寻找该公司的年报 (Annual Report)、中报 (Interim Report) 及业绩公告。
   - 链接格式必须是 www1.hkexnews.hk/listedco/listconews/sehk/... 结尾为 .pdf 的静态直连。
2. A股 (SSE/SZSE/BSE)：以巨潮资讯 (http://www.cninfo.com.cn) 为主。
   - 链接必须是 static.cninfo.com.cn/finalpage/...PDF。
3. 美股 (SEC)：以 https://www.sec.gov EDGAR 系统为准。
   - 提供 10-K, 10-Q 等官方存证链接。

检索指令：
- 优先寻找“年度报告”、“中期报告”、“季度报告”。
- 检索最近 25 份文件，确保时效性。
- 确保 downloadUrl 是无需中转、可直接在浏览器查看或下载的静态 PDF 资源链接。
- 严禁解析公告内容或生成摘要。`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: DISCLOSURE_SCHEMA
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    // 对获取到的链接进行基础过滤，确保是 http(s) 开头的合法链接
    const filteredFiles = (data.files || []).filter((f: any) => 
      f.downloadUrl && (f.downloadUrl.startsWith('http://') || f.downloadUrl.startsWith('https://'))
    );
    
    return {
      stockInfo: data.stockInfo,
      files: filteredFiles
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("无法获取披露数据。请检查网络或尝试更精确的股票名称（如包含 .HK 后缀）。");
  }
};
