/* ─── FEATURE 1: Campanhas Inteligentes ─── */
export function CampaignVisual() {
  return (
    <div className="fv-wrapper" style={{ borderRadius: '24px' }}>
      {/* Glow central */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)',
          borderRadius: 'inherit',
        }}
      />

      {/* Mini-card 1 — LinkedIn */}
      <div className="fv-campaign-card fv-campaign-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-white">Campanha LinkedIn</span>
          <span
            className="text-[9px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(124,58,237,0.2)', color: '#A78BFA' }}
          >
            Ativo
          </span>
        </div>
        <div className="fv-progress-bar">
          <div className="fv-progress-fill" style={{ width: '72%', background: 'linear-gradient(90deg, #7C3AED, #A855F7)' }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>48 leads</span>
          <span className="text-[9px] font-medium" style={{ color: '#A78BFA' }}>72%</span>
        </div>
      </div>

      {/* Mini-card 2 — Email */}
      <div className="fv-campaign-card fv-campaign-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-white">Campanha Email</span>
          <span
            className="text-[9px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(59,130,246,0.2)', color: '#93C5FD' }}
          >
            Em andamento
          </span>
        </div>
        <div className="fv-progress-bar">
          <div className="fv-progress-fill" style={{ width: '45%', background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>23 leads</span>
          <span className="text-[9px] font-medium" style={{ color: '#93C5FD' }}>45%</span>
        </div>
      </div>

      {/* Mini-card 3 — WhatsApp */}
      <div className="fv-campaign-card fv-campaign-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-white">Campanha WhatsApp</span>
          <span
            className="text-[9px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(16,185,129,0.2)', color: '#6EE7B7' }}
          >
            Concluído
          </span>
        </div>
        <div className="fv-progress-bar">
          <div className="fv-progress-fill" style={{ width: '100%', background: 'linear-gradient(90deg, #10B981, #34D399)' }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>91 leads</span>
          <span className="text-[9px] font-medium" style={{ color: '#6EE7B7' }}>100%</span>
        </div>
      </div>
    </div>
  );
}

/* ─── FEATURE 2: Scripts por IA ─── */
export function ScriptVisual() {
  return (
    <div className="fv-wrapper" style={{ borderRadius: '24px' }}>
      {/* Glow central */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.10) 0%, transparent 70%)',
          borderRadius: 'inherit',
        }}
      />

      {/* Chat interface */}
      <div className="fv-chat-container">
        {/* User bubble */}
        <div className="fv-chat-row fv-chat-user">
          <div className="fv-chat-bubble fv-bubble-user">
            <span className="text-[11px]" style={{ color: '#E2E8F0' }}>
              Crie um script para SDR B2B
            </span>
          </div>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
            style={{ background: 'rgba(124,58,237,0.3)', color: '#C4B5FD' }}
          >
            U
          </div>
        </div>

        {/* AI bubble */}
        <div className="fv-chat-row fv-chat-ai">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]"
            style={{ background: 'rgba(59,130,246,0.3)', color: '#93C5FD' }}
          >
            ⚡
          </div>
          <div className="fv-chat-bubble fv-bubble-ai">
            <span className="text-[10px] font-semibold block mb-1" style={{ color: '#93C5FD' }}>
              ORION
            </span>
            <span className="text-[11px]" style={{ color: '#CBD5E1' }}>
              Script gerado com 3 variações para seu público-alvo
              <span className="fv-cursor-blink">|</span>
            </span>
          </div>
        </div>

        {/* Variation tags */}
        <div className="flex gap-2 mt-3 ml-8">
          <span className="fv-variation-tag" style={{ borderColor: 'rgba(124,58,237,0.3)', color: '#C4B5FD' }}>
            Variação Cold
          </span>
          <span className="fv-variation-tag" style={{ borderColor: 'rgba(59,130,246,0.3)', color: '#93C5FD' }}>
            Variação Follow-up
          </span>
          <span className="fv-variation-tag" style={{ borderColor: 'rgba(168,85,247,0.3)', color: '#D8B4FE' }}>
            Variação Objeção
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── FEATURE 3: ROI Analytics ─── */
export function AnalyticsVisual() {
  const linePath = "M 10,160 C 60,140 100,120 140,90 C 180,60 220,50 260,30 C 290,15 310,10 330,8";
  const areaPath = "M 10,160 C 60,140 100,120 140,90 C 180,60 220,50 260,30 C 290,15 310,10 330,8 L 330,180 L 10,180 Z";

  return (
    <div className="fv-wrapper" style={{ borderRadius: '24px' }}>
      {/* Glow central */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.10) 0%, transparent 70%)',
          borderRadius: 'inherit',
        }}
      />

      {/* Floating metrics */}
      <div className="fv-metric fv-metric-1">
        <span className="fv-metric-value fv-value-purple">ROI +127%</span>
        <span className="fv-metric-label">vs mês anterior</span>
      </div>
      <div className="fv-metric fv-metric-2">
        <span className="fv-metric-value fv-value-blue">+48 Leads</span>
        <span className="fv-metric-label">esta semana</span>
      </div>
      <div className="fv-metric fv-metric-3">
        <span className="fv-metric-value fv-value-green">Taxa 34%</span>
        <span className="fv-metric-label">conversão</span>
      </div>

      {/* Chart SVG */}
      <svg className="fv-chart-svg" viewBox="0 0 340 180" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />
        <path
          d={linePath}
          fill="none"
          stroke="#10B981"
          strokeWidth="2"
          strokeDasharray="500"
          strokeDashoffset="500"
          className="fv-chart-line"
        />
        <circle cx="330" cy="8" r="4" fill="#10B981" className="fv-chart-dot" />
        <circle cx="330" cy="8" r="8" fill="rgba(16,185,129,0.2)" className="fv-chart-dot-glow" />
      </svg>
    </div>
  );
}
