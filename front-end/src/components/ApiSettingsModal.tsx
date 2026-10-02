import React, { useState } from 'react';
import { X, Check, RefreshCw, AlertTriangle, ExternalLink, Globe } from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
  onSaveUrl: (url: string) => void;
  connectionStatus: {
    status: 'connected' | 'connecting' | 'error' | 'mixed_content';
    count: number;
    lastChecked?: string;
    errorMessage?: string;
  };
  onManualRefresh: () => Promise<void>;
  onClearLocalCache?: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  apiUrl,
  onSaveUrl,
  connectionStatus,
  onManualRefresh,
  onClearLocalCache
}) => {
  const [urlInput, setUrlInput] = useState(apiUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isInputLocalHttp = urlInput.startsWith('http://127.0.0.1') || urlInput.startsWith('http://localhost');

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(urlInput.trim(), { method: 'GET' });
      if (!res.ok) {
        setTestResult({
          success: false,
          message: `HTTP ${res.status}: ${res.statusText}`
        });
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setTestResult({
          success: true,
          message: `Success! Received ${data.length} briefs from FastAPI backend.`
        });
      } else {
        setTestResult({
          success: true,
          message: `Connected, but received unexpected data structure: ${typeof data}`
        });
      }
    } catch (err: any) {
      if (isHttps && isInputLocalHttp) {
        setTestResult({
          success: false,
          message: `Browser Mixed Content Block: Browser refused to fetch insecure HTTP (${urlInput}) from HTTPS origin (${window.location.origin}). Use an HTTPS tunnel or run frontend locally.`
        });
      } else {
        setTestResult({
          success: false,
          message: `Connection failed: ${err.message || 'Network error / server not running on port 8000'}. Make sure your uvicorn server is active.`
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    onSaveUrl(urlInput.trim());
    await onManualRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] border-2 border-[#1B1B19] shadow-[8px_8px_0_#1B1B19] max-w-lg w-full p-6 text-[#1B1B19] space-y-5 animate-backdrop-fade">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#1B1B19]">
          <div className="label-mono font-bold text-[#1B1B19] flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${
              connectionStatus.status === 'connected'
                ? 'bg-emerald-500'
                : connectionStatus.status === 'connecting'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-[#E15D44]'
            }`} />
            <span>[BACKEND_SYNC] FASTAPI CONFIG</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 border border-[#1B1B19] hover:bg-[#1B1B19] hover:text-[#F8F7F4] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Status Banner */}
        <div className={`p-3 border text-xs font-mono flex items-start gap-2.5 ${
          connectionStatus.status === 'connected'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : connectionStatus.status === 'connecting'
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          {connectionStatus.status === 'connected' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wider">
              Status: {connectionStatus.status === 'connected' ? 'Connected & Synchronized' : connectionStatus.status === 'connecting' ? 'Polling backend...' : 'Disconnected / Unreachable'}
            </div>
            <div className="opacity-80 text-[11px]">
              {connectionStatus.errorMessage || (connectionStatus.status === 'connected' ? `Synchronized ${connectionStatus.count} articles. Auto-polling every 5s.` : 'Waiting for successful heartbeat.')}
            </div>
            {connectionStatus.lastChecked && (
              <div className="text-[10px] opacity-60">
                Last check: {connectionStatus.lastChecked}
              </div>
            )}
          </div>
        </div>

        {/* Mixed Content Warning if on HTTPS */}
        {isHttps && isInputLocalHttp && (
          <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Browser Mixed Content Notice (HTTPS → HTTP)</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This app is currently served over <strong>HTTPS</strong>. Modern web browsers strictly block direct requests to insecure <code>http://127.0.0.1:8000</code> due to Mixed Content policies.
            </p>
            <div className="text-[11px] space-y-1">
              <div className="font-bold">Two easy ways to sync:</div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  <strong>Option A (Tunnel):</strong> Expose local port 8000 over HTTPS with ngrok (<code>ngrok http 8000</code>) or localtunnel, then paste your <code>https://.../api/news</code> URL below.
                </li>
                <li>
                  <strong>Option B (Local):</strong> Run Vite locally (<code>npm run dev</code>) at <code>http://localhost:3000</code> so both sides run over HTTP.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* URL Input Form */}
        <div className="space-y-2">
          <label className="label-mono font-bold text-xs text-[#1B1B19]">
            FastAPI News Endpoint URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://127.0.0.1:8000/api/news"
              className="flex-1 bg-[#FFFFFF] border border-[#1B1B19] px-3 py-2 text-xs font-mono text-[#1B1B19] focus:outline-none focus:ring-1 focus:ring-[#1B1B19]"
            />
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="editorial-btn-outline px-3 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-2.5 text-xs font-mono border ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}>
            {testResult.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1B1B19]/20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setUrlInput('http://127.0.0.1:8000/api/news')}
              className="text-[11px] font-mono underline opacity-70 hover:opacity-100 cursor-pointer"
            >
              Reset URL
            </button>
            {onClearLocalCache && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Wipe local browser cache and force re-sync with database?')) {
                    onClearLocalCache();
                    onClose();
                  }
                }}
                className="text-[11px] font-mono text-rose-600 underline hover:text-rose-800 cursor-pointer"
              >
                Clear Local Cache
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-[#1B1B19] text-xs font-mono hover:bg-[#1B1B19]/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="editorial-btn px-4 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Sync</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
