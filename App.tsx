
import React, { useState, useEffect } from 'react';
import { Search, Download, FileText, ExternalLink, Info, Database, Smartphone, ChevronDown, ChevronUp, Calendar, Tag, ShieldCheck, Globe, Copy, Check } from 'lucide-react';
import { fetchDisclosures } from './services/geminiService';
import { SearchState, MarketType } from './types';
import { SkeletonRow } from './components/Skeleton';

const App: React.FC = () => {
  const [state, setState] = useState<SearchState>({
    query: '',
    isSearching: false,
    error: null,
    results: [],
    stockInfo: null,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });
  }, []);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!state.query.trim()) return;

    setState(prev => ({ ...prev, isSearching: true, error: null }));
    setExpandedIds(new Set()); 

    try {
      const { stockInfo, files } = await fetchDisclosures(state.query);
      setState(prev => ({
        ...prev,
        isSearching: false,
        results: files,
        stockInfo: stockInfo
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: err.message || '发生未知错误。'
      }));
    }
  };

  const getMarketBadgeColor = (market: MarketType) => {
    if (market.includes('A股')) return 'bg-red-100 text-red-700 border-red-200';
    if (market.includes('港股')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (market.includes('美股')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 导航栏 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-sm">
              <Database className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
              DisclosureHub
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {showInstallBtn && (
              <button 
                onClick={handleInstallClick}
                className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-200 animate-pulse active:scale-95 transition-transform"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>安装</span>
              </button>
            )}
            <div className="hidden md:flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest space-x-4">
              <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5"></span> A股直连</span>
              <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></span> 港股直连</span>
              <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span> SEC EDGAR</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* 搜索区域 */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">全网官方披露追踪</h2>
            <p className="text-slate-500 text-sm md:text-lg font-medium italic">若下载链接在移动端打不开，请尝试点击详情展开并“复制链接”</p>
          </div>
          
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-32 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-base md:text-lg transition-all outline-none"
              placeholder="搜索股票代码 (如: 00700, AAPL, 000001)..."
              value={state.query}
              onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
            />
            <button
              type="submit"
              disabled={state.isSearching}
              className="absolute inset-y-2 right-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center shadow-lg shadow-indigo-200 active:scale-95"
            >
              {state.isSearching ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                '深度检索'
              )}
            </button>
          </form>
        </div>

        {/* 错误提示 */}
        {state.error && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600 mb-8">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{state.error}</p>
          </div>
        )}

        {/* 搜索结果 */}
        {state.stockInfo && !state.isSearching && (
          <div className="w-full max-w-4xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 股票信息卡片 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <FileText className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">{state.stockInfo.name}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-sm font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">{state.stockInfo.ticker}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${getMarketBadgeColor(state.stockInfo.market)}`}>
                      {state.stockInfo.market}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">多源覆盖状态</span>
                <span className="text-sm font-semibold text-emerald-600 flex items-center bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  已验证官方存证链接
                </span>
              </div>
            </div>

            {/* 文件列表 */}
            <div className="space-y-3">
              <div className="px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>官方披露记录 ({state.results.length})</span>
                <span className="hidden md:block">点击展开详细合规信息</span>
              </div>
              
              {state.results.map((file) => {
                const isExpanded = expandedIds.has(file.id);
                return (
                  <div key={file.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-200 transition-all duration-300">
                    <div 
                      onClick={() => toggleExpand(file.id)}
                      className="p-4 md:p-5 flex items-start gap-4 cursor-pointer active:bg-slate-50 transition-colors"
                    >
                      <div className="hidden sm:flex flex-shrink-0 w-10 h-10 bg-slate-50 rounded-xl items-center justify-center text-slate-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-1">
                          <h4 className="text-sm md:text-base font-bold text-slate-900 line-clamp-2 md:line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {file.title}
                          </h4>
                          <span className="text-xs font-mono font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded border border-slate-100 self-start md:mt-0.5">
                            {file.publishDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-50 text-indigo-600 uppercase">
                            {file.type}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 truncate flex items-center">
                            <ShieldCheck className="w-2.5 h-2.5 mr-1 text-emerald-500" />
                            {file.source}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={file.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 active:scale-90 transition-all"
                          title="访问原始文件"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                        <div className="text-slate-300">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                    
                    {/* 详情展开区域 */}
                    {isExpanded && (
                      <div className="px-4 pb-5 pt-0 border-t border-slate-50 bg-slate-50/30 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="flex items-center gap-2.5">
                            <Globe className="w-4 h-4 text-slate-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">官方登记源</span>
                              <span className="text-xs font-bold text-slate-600">{file.source}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Tag className="w-4 h-4 text-slate-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">披露类别</span>
                              <span className="text-xs font-bold text-slate-600">{file.type}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">法定发布时间</span>
                              <span className="text-xs font-bold text-slate-600">{file.publishDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCopyLink(file.downloadUrl, file.id); }}
                            className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200"
                          >
                            {copiedId === file.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === file.id ? '已复制' : '复制直连链接'}</span>
                          </button>
                          <a 
                            href={file.downloadUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center group bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
                          >
                            访问官方文件
                            <ExternalLink className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {state.isSearching && (
          <div className="w-full max-w-4xl mx-auto space-y-4">
            <div className="h-32 bg-white border border-slate-200 rounded-3xl animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-20 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          </div>
        )}

        {/* 初始引导 */}
        {!state.stockInfo && !state.isSearching && !state.error && (
          <div className="mt-12 md:mt-24 flex flex-col items-center justify-center text-center px-4">
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-indigo-600 blur-3xl opacity-10 animate-pulse"></div>
              <div className="relative w-20 h-20 md:w-24 md:h-24 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-200 flex items-center justify-center rotate-3 transform hover:rotate-0 transition-transform duration-500">
                <Globe className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">官方披露，直达存证</h3>
            <p className="max-w-sm md:max-w-md text-slate-500 text-sm md:text-base font-medium">
              支持 A 股（巨潮静态源）、港股（披露易 PDF 源）及美股（SEC EDGAR）。深度优化下载兼容性。
            </p>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="bg-white/50 border-t border-slate-100 py-10 mt-20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-slate-400">
          <div className="flex items-center space-x-3 mb-6 md:mb-0">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <Database className="w-4 h-4 text-slate-400" />
            </div>
            <span className="font-black text-slate-800 text-sm tracking-tight">DisclosureHub</span>
            <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full">v1.4.0 (Stable Links)</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">
             <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200"></span>
              <span>链接稳定性优化已上线</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
