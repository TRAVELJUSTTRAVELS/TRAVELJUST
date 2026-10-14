import React, { useState, useEffect } from 'react';
import {
  Globe,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Search,
  Save,
  Send,
  Eye,
  RefreshCw,
  Code2,
  TrendingUp,
} from 'lucide-react';
import { SiteOptimizerSettings } from '../../types/owner';
import { ownerService } from '../../services/ownerService';

export const OwnerSiteOptimizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'technical' | 'local' | 'schemas' | 'performance' | 'conversions'>('technical');
  const [settings, setSettings] = useState<SiteOptimizerSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadSettings = async () => {
    setIsLoading(true);
    const data = await ownerService.getSiteOptimizer();
    setSettings(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (publish: boolean) => {
    if (!settings) return;
    setIsSaving(true);
    const res = await ownerService.saveSiteOptimizer(settings, publish);
    setIsSaving(false);
    if (res.success && res.settings) {
      setSettings(res.settings);
      setNotification(res.message || 'Saved successfully');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
        <span>Loading Site Optimizer settings from backend...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              VERSION {settings.version} • {settings.isPublished ? 'LIVE PUBLISHED' : 'DRAFT'}
            </span>
            <span className="text-[11px] text-slate-400">
              Updated by {settings.updatedBy}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Advanced Site Optimizer & SEO</h2>
          <p className="text-xs text-slate-500">
            Control Technical SEO, Local Landing Pages, Structured Data, Core Web Vitals and Conversion Funnels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{previewMode ? 'Edit Mode' : 'Preview Meta'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs cursor-pointer"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Live</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('technical')}
          className={`pb-3 px-3 transition-all border-b-2 cursor-pointer ${
            activeTab === 'technical' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
          }`}
        >
          Technical SEO
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('local')}
          className={`pb-3 px-3 transition-all border-b-2 cursor-pointer ${
            activeTab === 'local' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
          }`}
        >
          Local SEO ({settings.localSeoDestinations?.length || 0} Routes)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('schemas')}
          className={`pb-3 px-3 transition-all border-b-2 cursor-pointer ${
            activeTab === 'schemas' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
          }`}
        >
          Structured Data (JSON-LD)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('performance')}
          className={`pb-3 px-3 transition-all border-b-2 cursor-pointer ${
            activeTab === 'performance' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
          }`}
        >
          Core Web Vitals ({settings.performanceScores.overall}/100)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('conversions')}
          className={`pb-3 px-3 transition-all border-b-2 cursor-pointer ${
            activeTab === 'conversions' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
          }`}
        >
          Conversion Tracking
        </button>
      </div>

      {/* TAB 1: Technical SEO */}
      {activeTab === 'technical' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 max-w-3xl">
          {previewMode ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Google Search Result Preview</span>
              <p className="text-blue-700 font-medium text-base hover:underline cursor-pointer">
                {settings.metaTitle}
              </p>
              <p className="text-emerald-700 text-xs font-mono">{settings.canonicalUrl}</p>
              <p className="text-slate-600 text-xs leading-relaxed">{settings.metaDescription}</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Global Meta Title ({settings.metaTitle.length}/60 chars)
                </label>
                <input
                  type="text"
                  value={settings.metaTitle}
                  onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Global Meta Description ({settings.metaDescription.length}/160 chars)
                </label>
                <textarea
                  rows={3}
                  value={settings.metaDescription}
                  onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Canonical URL</label>
                  <input
                    type="text"
                    value={settings.canonicalUrl}
                    onChange={(e) => setSettings({ ...settings, canonicalUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Primary H1 Headline</label>
                  <input
                    type="text"
                    value={settings.h1}
                    onChange={(e) => setSettings({ ...settings, h1: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Robots.txt Directives</label>
                <textarea
                  rows={3}
                  value={settings.robotsTxt}
                  onChange={(e) => setSettings({ ...settings, robotsTxt: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Local SEO */}
      {activeTab === 'local' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.localSeoDestinations?.map((dest, idx) => (
            <div key={dest.city} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">{dest.city}</h3>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {dest.route}
                </span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Target Page Title</label>
                <input
                  type="text"
                  value={dest.title}
                  onChange={(e) => {
                    const next = [...settings.localSeoDestinations];
                    next[idx].title = e.target.value;
                    setSettings({ ...settings, localSeoDestinations: next });
                  }}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Search Description</label>
                <textarea
                  rows={2}
                  value={dest.description}
                  onChange={(e) => {
                    const next = [...settings.localSeoDestinations];
                    next[idx].description = e.target.value;
                    setSettings({ ...settings, localSeoDestinations: next });
                  }}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs mt-1"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Target Keywords:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dest.keywords?.map((k) => (
                    <span key={k} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Structured Data (JSON-LD) */}
      {activeTab === 'schemas' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 max-w-2xl text-xs">
          <p className="text-slate-600 leading-relaxed">
            Schema.org rich snippets allow Google to show ratings, price ranges, telephone numbers, and FAQ drop-downs right inside the search results.
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.schemas.taxiService}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    schemas: { ...settings.schemas, taxiService: e.target.checked },
                  })
                }
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 block">schema.org/TaxiService</span>
                <span className="text-slate-500 text-[11px]">
                  Enables Google Car & Taxi rich search entity with Mysuru fleet ratings and instant booking links.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.schemas.localBusiness}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    schemas: { ...settings.schemas, localBusiness: e.target.checked },
                  })
                }
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 block">schema.org/LocalBusiness</span>
                <span className="text-slate-500 text-[11px]">
                  Configures local geo-coordinates, telephone (+91 9740754400), address and opening hours for Google Maps.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.schemas.faqPage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    schemas: { ...settings.schemas, faqPage: e.target.checked },
                  })
                }
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 block">schema.org/FAQPage</span>
                <span className="text-slate-500 text-[11px]">
                  Displays expandable questions and answers directly underneath TRAVEL JUST listings in Google Search.
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: Core Web Vitals */}
      {activeTab === 'performance' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Live Production Performance Score</h3>
              <p className="text-xs text-slate-500">Real User Monitoring (RUM) metrics measured on edge CDN.</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 border-2 border-emerald-500 flex items-center justify-center font-black text-2xl">
              {settings.performanceScores.overall}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">FCP (First Contentful)</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">{settings.performanceScores.fcp}s</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Good (&lt; 1.8s)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">LCP (Largest Contentful)</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">{settings.performanceScores.lcp}s</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Good (&lt; 2.5s)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">CLS (Cumulative Shift)</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">{settings.performanceScores.cls}</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Good (&lt; 0.1)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">FID / INP (Interactivity)</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">{settings.performanceScores.fid}ms</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Good (&lt; 100ms)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Conversion Tracking */}
      {activeTab === 'conversions' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">Booking Funnel & Customer Actions</h3>
            <p className="text-xs text-slate-500">Live conversion tracking across desktop and mobile users.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Booking Starts</span>
              <span className="text-xl font-black text-slate-800 mt-1 block">
                {settings.conversionStats.bookingStarts}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Completions</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">
                {settings.conversionStats.bookingCompletions}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Abandonments</span>
              <span className="text-xl font-black text-rose-600 mt-1 block">
                {settings.conversionStats.abandonedBookings}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">WhatsApp Inquiries</span>
              <span className="text-xl font-black text-[#128C7E] mt-1 block">
                {settings.conversionStats.whatsAppClicks}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Call Clicks</span>
              <span className="text-xl font-black text-blue-700 mt-1 block">
                {settings.conversionStats.phoneClicks}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
