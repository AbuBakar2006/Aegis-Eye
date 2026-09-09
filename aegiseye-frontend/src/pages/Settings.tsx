import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, Server, FlaskConical, Wifi, WifiOff,
  Save, RotateCcw, Info, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { apiClient } from '@/api/client';
import { BackendStatus } from '@/components/shared/BackendStatus';

export default function Settings() {
  const demoMode = useAppStore((s) => s.demoMode);
  const setDemoMode = useAppStore((s) => s.setDemoMode);
  const apiBaseUrl = useAppStore((s) => s.apiBaseUrl);
  const setApiBaseUrl = useAppStore((s) => s.setApiBaseUrl);
  const setConnectionStatus = useAppStore((s) => s.setConnectionStatus);
  const setLastChecked = useAppStore((s) => s.setLastChecked);

  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSaveUrl = () => {
    setApiBaseUrl(urlInput.replace(/\/$/, ''));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setConnectionStatus('checking');
    // Temporarily test with the input URL
    const ok = await apiClient.ping();
    setTestResult(ok ? 'ok' : 'fail');
    setConnectionStatus(ok ? 'connected' : 'error');
    setLastChecked(new Date().toISOString());
    setTesting(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Configure API connection and display preferences</p>
      </div>

      {/* Demo Mode */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Demo Mode</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Use simulated data for FYP presentation without a connected backend.
              Disable this when the backend is running.
            </p>
          </div>
          {/* Toggle */}
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`ml-auto relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none ${
              demoMode ? 'bg-yellow-500 border-yellow-500' : 'bg-gray-700 border-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                demoMode ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div
          className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
            demoMode
              ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
              : 'bg-green-500/10 border border-green-500/20 text-green-400'
          }`}
        >
          {demoMode ? (
            <><FlaskConical className="w-3.5 h-3.5" /> Demo Mode is ON — mock data is displayed</>
          ) : (
            <><Wifi className="w-3.5 h-3.5" /> Demo Mode is OFF — connecting to real backend</>
          )}
        </div>
      </motion.div>

      {/* API Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-6"
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Backend API URL</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Points to the FastAPI server. Default from <code className="font-mono bg-white/5 px-1 rounded text-blue-400">VITE_API_BASE_URL</code>.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://localhost:8000"
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <button
              onClick={handleSaveUrl}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-sm font-medium transition-colors"
            >
              {saved ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 transition-colors disabled:opacity-50"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              Test Connection
            </button>

            {testResult === 'ok' && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-xs text-green-400"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Backend reachable!
              </motion.div>
            )}
            {testResult === 'fail' && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-xs text-red-400"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cannot reach backend
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Current status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-blue-400" />
          System Status
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Backend Status</span>
            <BackendStatus />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">API Base URL</span>
            <span className="font-mono text-xs text-blue-400">{apiBaseUrl}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Demo Mode</span>
            <span className={demoMode ? 'text-yellow-400' : 'text-green-400'}>
              {demoMode ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Info block */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 text-xs text-blue-400/70"
      >
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
        <div className="space-y-1">
          <p>
            <strong className="text-blue-400">Backend-owned endpoints:</strong>{' '}
            <code className="bg-white/5 px-1 rounded font-mono">GET /api/incidents</code>{' '}
            <code className="bg-white/5 px-1 rounded font-mono">GET /api/incidents/&#123;id&#125;/clip</code>{' '}
            <code className="bg-white/5 px-1 rounded font-mono">GET /api/incidents/&#123;id&#125;/report</code>
          </p>
          <p>
            Camera feeds, AI inference, severity scoring, blackbox generation, and report PDF creation
            are all handled exclusively by the existing backend. This dashboard only displays the results.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
