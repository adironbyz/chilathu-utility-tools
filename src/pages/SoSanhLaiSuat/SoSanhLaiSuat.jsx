import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo.jsx'
import SEO from '../../components/SEO.jsx'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare01Icon, LinkSquare01Icon } from '@hugeicons/core-free-icons'
import { AffiliateBlock } from '../../components/affiliate/index.js'
import '../../components/affiliate/Affiliate.css'
import { trackAppCrosslink, trackToolCalculateDone } from '../../lib/analytics.js'
import './SoSanhLaiSuat.css'

// ─── Bank data ────────────────────────────────────────────────────────────────
// Lãi suất tham khảo (online, %/năm) — cập nhật tháng 04/2026
// Gửi tại quầy thường thấp hơn 0.1–0.2%/năm

const VQR = (code) => `https://api.vietqr.io/img/${code}.png`

const BANKS = [
  // ── Nhà nước ──────────────────────────────────────────────────────────────
  { id: 'vietcombank', name: 'Vietcombank',    type: 'state',   logo: VQR('VCB'),      initial: 'VC', color: '#dcfce7', textColor: '#15803d', rates: { 1: 2.3, 3: 2.9, 6: 4.1, 12: 4.6, 24: 4.9, 36: 4.9 } },
  { id: 'vietinbank',  name: 'VietinBank',     type: 'state',   logo: VQR('ICB'),      initial: 'VT', color: '#fef9c3', textColor: '#854d0e', rates: { 1: 2.5, 3: 3.0, 6: 4.2, 12: 4.7, 24: 5.0, 36: 5.0 } },
  { id: 'bidv',        name: 'BIDV',           type: 'state',   logo: VQR('BIDV'),     initial: 'BI', color: '#dbeafe', textColor: '#1d4ed8', rates: { 1: 2.5, 3: 3.0, 6: 4.2, 12: 4.7, 24: 5.0, 36: 5.0 } },
  { id: 'agribank',    name: 'Agribank',       type: 'state',   logo: VQR('VBA'),      initial: 'AG', color: '#d1fae5', textColor: '#065f46', rates: { 1: 2.5, 3: 3.0, 6: 4.2, 12: 4.7, 24: 5.0, 36: 5.0 } },
  { id: 'coopbank',    name: 'COOPBANK',       type: 'state',   logo: VQR('COOPBANK'), initial: 'CO', color: '#dcfce7', textColor: '#166534', rates: { 1: 2.8, 3: 3.2, 6: 4.5, 12: 5.2, 24: 5.4, 36: 5.5 } },
  // ── TMCP ──────────────────────────────────────────────────────────────────
  { id: 'acb',         name: 'ACB',            type: 'tmcp',    logo: VQR('ACB'),      initial: 'AC', color: '#fef3c7', textColor: '#92400e', rates: { 1: 3.1, 3: 3.6, 6: 4.6, 12: 5.2, 24: 5.4, 36: 5.5 } },
  { id: 'mbbank',      name: 'MB Bank',        type: 'tmcp',    logo: VQR('MB'),       initial: 'MB', color: '#ede9fe', textColor: '#5b21b6', rates: { 1: 3.3, 3: 3.8, 6: 4.8, 12: 5.3, 24: 5.6, 36: 5.7 } },
  { id: 'techcom',     name: 'Techcombank',    type: 'tmcp',    logo: VQR('TCB'),      initial: 'TC', color: '#fee2e2', textColor: '#b91c1c', rates: { 1: 3.0, 3: 3.5, 6: 4.5, 12: 5.0, 24: 5.2, 36: 5.3 } },
  { id: 'vpbank',      name: 'VPBank',         type: 'tmcp',    logo: VQR('VPB'),      initial: 'VP', color: '#d1fae5', textColor: '#065f46', rates: { 1: 3.2, 3: 3.8, 6: 4.7, 12: 5.3, 24: 5.5, 36: 5.6 } },
  { id: 'vib',         name: 'VIB',            type: 'tmcp',    logo: VQR('VIB'),      initial: 'VB', color: '#dbeafe', textColor: '#1d4ed8', rates: { 1: 3.2, 3: 3.7, 6: 4.6, 12: 5.2, 24: 5.4, 36: 5.5 } },
  { id: 'shb',         name: 'SHB',            type: 'tmcp',    logo: VQR('SHB'),      initial: 'SH', color: '#fce7f3', textColor: '#9d174d', rates: { 1: 3.5, 3: 4.0, 6: 5.2, 12: 5.8, 24: 6.0, 36: 6.1 } },
  { id: 'hdbank',      name: 'HDBank',         type: 'tmcp',    logo: VQR('HDB'),      initial: 'HD', color: '#ffedd5', textColor: '#c2410c', rates: { 1: 3.5, 3: 4.1, 6: 5.3, 12: 5.9, 24: 6.1, 36: 6.2 } },
  { id: 'ocb',         name: 'OCB',            type: 'tmcp',    logo: VQR('OCB'),      initial: 'OC', color: '#ecfdf5', textColor: '#065f46', rates: { 1: 3.4, 3: 3.9, 6: 5.1, 12: 5.6, 24: 5.8, 36: 5.9 } },
  { id: 'msb',         name: 'MSB',            type: 'tmcp',    logo: VQR('MSB'),      initial: 'MS', color: '#ede9fe', textColor: '#5b21b6', rates: { 1: 3.4, 3: 4.0, 6: 5.0, 12: 5.5, 24: 5.7, 36: 5.8 } },
  { id: 'tpbank',      name: 'TPBank',         type: 'tmcp',    logo: VQR('TPB'),      initial: 'TP', color: '#fef2f2', textColor: '#b91c1c', rates: { 1: 3.4, 3: 4.0, 6: 5.0, 12: 5.5, 24: 5.7, 36: 5.8 } },
  { id: 'sacombank',   name: 'Sacombank',      type: 'tmcp',    logo: VQR('STB'),      initial: 'ST', color: '#fef9c3', textColor: '#92400e', rates: { 1: 3.2, 3: 3.8, 6: 4.8, 12: 5.3, 24: 5.5, 36: 5.6 } },
  { id: 'seabank',     name: 'SeABank',        type: 'tmcp',    logo: VQR('SEAB'),     initial: 'SA', color: '#fef9c3', textColor: '#854d0e', rates: { 1: 3.5, 3: 4.1, 6: 5.1, 12: 5.6, 24: 5.9, 36: 6.0 } },
  { id: 'lpb',         name: 'LPBank',         type: 'tmcp',    logo: VQR('LPB'),      initial: 'LP', color: '#fef2f2', textColor: '#b91c1c', rates: { 1: 3.5, 3: 4.1, 6: 5.2, 12: 5.7, 24: 5.9, 36: 6.0 } },
  { id: 'eximbank',    name: 'Eximbank',       type: 'tmcp',    logo: VQR('EIB'),      initial: 'EX', color: '#ecfdf5', textColor: '#065f46', rates: { 1: 3.3, 3: 3.9, 6: 4.9, 12: 5.4, 24: 5.6, 36: 5.7 } },
  { id: 'nab',         name: 'Nam A Bank',     type: 'tmcp',    logo: VQR('NAB'),      initial: 'NA', color: '#fce7f3', textColor: '#9d174d', rates: { 1: 3.6, 3: 4.2, 6: 5.3, 12: 5.8, 24: 6.0, 36: 6.1 } },
  { id: 'abb',         name: 'ABBank',         type: 'tmcp',    logo: VQR('ABB'),      initial: 'AB', color: '#ede9fe', textColor: '#5b21b6', rates: { 1: 3.4, 3: 4.0, 6: 5.0, 12: 5.5, 24: 5.7, 36: 5.8 } },
  { id: 'bvb',         name: 'BaoViet Bank',   type: 'tmcp',    logo: VQR('BVB'),      initial: 'BV', color: '#dbeafe', textColor: '#1d4ed8', rates: { 1: 3.5, 3: 4.1, 6: 5.1, 12: 5.6, 24: 5.8, 36: 5.9 } },
  { id: 'klb',         name: 'Kienlongbank',   type: 'tmcp',    logo: VQR('KLB'),      initial: 'KL', color: '#d1fae5', textColor: '#065f46', rates: { 1: 3.6, 3: 4.2, 6: 5.3, 12: 5.8, 24: 6.0, 36: 6.1 } },
  { id: 'ncb',         name: 'NCB',            type: 'tmcp',    logo: VQR('NCB'),      initial: 'NC', color: '#ffedd5', textColor: '#c2410c', rates: { 1: 3.7, 3: 4.4, 6: 5.5, 12: 6.0, 24: 6.1, 36: 6.2 } },
  { id: 'pvcom',       name: 'PVcomBank',      type: 'tmcp',    logo: VQR('PVCB'),     initial: 'PV', color: '#fee2e2', textColor: '#b91c1c', rates: { 1: 3.5, 3: 4.1, 6: 5.2, 12: 5.7, 24: 5.9, 36: 6.0 } },
  { id: 'vccb',        name: 'VietCapital',    type: 'tmcp',    logo: VQR('VCCB'),     initial: 'VK', color: '#fdf4ff', textColor: '#7e22ce', rates: { 1: 3.6, 3: 4.2, 6: 5.2, 12: 5.7, 24: 5.9, 36: 6.0 } },
  { id: 'bab',         name: 'BacA Bank',      type: 'tmcp',    logo: VQR('BAB'),      initial: 'BA', color: '#f0f9ff', textColor: '#0369a1', rates: { 1: 3.5, 3: 4.1, 6: 5.1, 12: 5.6, 24: 5.8, 36: 5.9 } },
  { id: 'vab',         name: 'VietABank',      type: 'tmcp',    logo: VQR('VAB'),      initial: 'VA', color: '#fef9c3', textColor: '#854d0e', rates: { 1: 3.5, 3: 4.1, 6: 5.1, 12: 5.6, 24: 5.8, 36: 5.9 } },
  { id: 'pgb',         name: 'PGBank',         type: 'tmcp',    logo: VQR('PGB'),      initial: 'PG', color: '#dcfce7', textColor: '#166534', rates: { 1: 3.4, 3: 4.0, 6: 5.0, 12: 5.5, 24: 5.7, 36: 5.8 } },
  { id: 'vietbank',    name: 'VietBank',       type: 'tmcp',    logo: VQR('VIETBANK'), initial: 'VB', color: '#ede9fe', textColor: '#5b21b6', rates: { 1: 3.6, 3: 4.2, 6: 5.2, 12: 5.7, 24: 5.9, 36: 6.0 } },
  { id: 'sgicb',       name: 'SaigonBank',     type: 'tmcp',    logo: VQR('SGICB'),    initial: 'SG', color: '#fce7f3', textColor: '#9d174d', rates: { 1: 3.4, 3: 4.0, 6: 5.0, 12: 5.5, 24: 5.7, 36: 5.8 } },
  { id: 'mbv',         name: 'MBV',            type: 'tmcp',    logo: VQR('MBV'),      initial: 'MV', color: '#f0f9ff', textColor: '#0369a1', rates: { 1: 3.3, 3: 3.9, 6: 4.9, 12: 5.4, 24: 5.6, 36: 5.7 } },
  // ── Số / Ví điện tử ───────────────────────────────────────────────────────
  { id: 'timo',        name: 'Timo',           type: 'digital', logo: VQR('TIMO'),     initial: 'TM', color: '#f0f9ff', textColor: '#0369a1', rates: { 1: 3.8, 3: 4.5, 6: 5.5, 12: 6.1, 24: 6.2, 36: 6.2 } },
  { id: 'cake',        name: 'Cake by VPB',    type: 'digital', logo: VQR('CAKE'),     initial: 'CK', color: '#fdf4ff', textColor: '#7e22ce', rates: { 1: 3.7, 3: 4.4, 6: 5.4, 12: 6.0, 24: 6.1, 36: 6.1 } },
  { id: 'ubank',       name: 'Ubank',          type: 'digital', logo: VQR('Ubank'),    initial: 'UB', color: '#f0fdf4', textColor: '#15803d', rates: { 1: 3.7, 3: 4.4, 6: 5.4, 12: 6.0, 24: 6.1, 36: 6.1 } },
  { id: 'vikki',       name: 'Vikki',          type: 'digital', logo: VQR('Vikki'),    initial: 'VK', color: '#fdf4ff', textColor: '#7e22ce', rates: { 1: 3.8, 3: 4.5, 6: 5.5, 12: 5.9, 24: 6.0, 36: 6.1 } },
  { id: 'momo',        name: 'MoMo',           type: 'digital', logo: VQR('momo'),     initial: 'MM', color: '#fce7f3', textColor: '#9d174d', rates: { 1: 3.5, 3: 4.2, 6: 5.2, 12: 5.8, 24: 5.9, 36: 5.9 } },
  { id: 'vtlmoney',    name: 'Viettel Money',  type: 'digital', logo: VQR('VTLMONEY'), initial: 'VT', color: '#fee2e2', textColor: '#b91c1c', rates: { 1: 3.6, 3: 4.3, 6: 5.3, 12: 5.8, 24: 6.0, 36: 6.0 } },
  { id: 'vnptmoney',   name: 'VNPT Money',     type: 'digital', logo: VQR('VNPTMONEY'),initial: 'VN', color: '#dbeafe', textColor: '#1d4ed8', rates: { 1: 3.4, 3: 4.0, 6: 5.0, 12: 5.5, 24: 5.7, 36: 5.7 } },
]

const TERMS = [
  { val: 1,  label: '1 tháng' },
  { val: 3,  label: '3 tháng' },
  { val: 6,  label: '6 tháng' },
  { val: 12, label: '12 tháng' },
  { val: 24, label: '24 tháng' },
  { val: 36, label: '36 tháng' },
]

const TERM_CHIPS = [
  { val: 1,  label: '1T'  },
  { val: 3,  label: '3T'  },
  { val: 6,  label: '6T'  },
  { val: 12, label: '12T' },
  { val: 24, label: '24T' },
  { val: 36, label: '36T' },
]

const AMOUNT_PRESETS = [
  { label: '10tr',   val: 10_000_000   },
  { label: '50tr',   val: 50_000_000   },
  { label: '100tr',  val: 100_000_000  },
  { label: '200tr',  val: 200_000_000  },
  { label: '500tr',  val: 500_000_000  },
  { label: '1 tỷ',   val: 1_000_000_000 },
]

const FILTER_OPTS = [
  { id: 'all',     label: 'Tất cả' },
  { id: 'state',   label: 'Nhà nước' },
  { id: 'tmcp',    label: 'TMCP' },
  { id: 'digital', label: 'Số & Ví' },
]

const TYPE_LABELS = { state: 'Nhà nước', tmcp: 'TMCP', digital: 'Ngân hàng số' }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseVND(v) {
  const n = parseInt((v || '').replace(/\./g, '').replace(/\D/g, ''), 10)
  return isNaN(n) || n <= 0 ? 0 : n
}

function formatInput(raw) {
  const digits = (raw || '').replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toLocaleString('vi-VN')
}

function fmtVND(n) {
  return Math.round(n).toLocaleString('vi-VN') + 'đ'
}

function calcInterest(principal, rateAnnual, termMonths) {
  return Math.round(principal * (rateAnnual / 100) * (termMonths / 12))
}

// ─── BankLogo ─────────────────────────────────────────────────────────────────

function BankLogo({ bank }) {
  const [err, setErr] = useState(false)
  return (
    <span
      className="ssl-bank-logo"
      style={err ? { background: bank.color, color: bank.textColor } : {}}
    >
      {!err
        ? <img src={bank.logo} alt={bank.name} onError={() => setErr(true)} />
        : bank.initial
      }
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SoSanhLaiSuat() {
  const navigate = useNavigate()

  const [amountInput, setAmountInput] = useState('')
  const [term,        setTerm]        = useState(12)
  const [filter,      setFilter]      = useState('all')
  const [online,      setOnline]      = useState(true)

  const principal = parseVND(amountInput)
  const valid = principal >= 1_000_000

  const ranked = useMemo(() => {
    const list = filter === 'all' ? BANKS : BANKS.filter(b => b.type === filter)
    return list
      .map(b => {
        const baseRate = b.rates[term] ?? 0
        const rate     = online ? baseRate : Math.max(0, baseRate - 0.2)
        const interest = valid ? calcInterest(principal, rate, term) : 0
        return { ...b, rate, interest, total: principal + interest }
      })
      .sort((a, b) => b.rate - a.rate)
  }, [principal, term, filter, online, valid])

  const topRate  = ranked[0]?.rate ?? 0
  const topBank  = ranked[0]
  const termLabel = TERMS.find(t => t.val === term)?.label ?? `${term} tháng`

  // ── Fire calculate_done event once per session ──
  const calcFiredRef = useRef(false)
  useEffect(() => {
    if (valid && !calcFiredRef.current) {
      trackToolCalculateDone('so-sanh-lai-suat')
      calcFiredRef.current = true
    }
  }, [valid])

  return (
    <div className="ssl-page notebook-bg">
      <SEO
        title="So Sánh Lãi Suất Ngân Hàng 2026 — Tiết kiệm có kỳ hạn"
        description="So sánh lãi suất tiết kiệm có kỳ hạn của 18+ ngân hàng Việt Nam. Nhập số tiền, chọn kỳ hạn — xem ngay ngân hàng nào trả lãi cao nhất, miễn phí."
        path="/so-sanh-lai-suat"
        keywords="so sánh lãi suất ngân hàng, lãi suất tiết kiệm, ngân hàng lãi cao nhất 2026, gửi tiết kiệm bao nhiêu, lãi suất tháng"
      />

      <header className="ssl-header">
        <Logo />
        <button className="ssl-menu-btn" onClick={() => navigate('/')} aria-label="Tất cả công cụ">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={22} color="currentColor" strokeWidth={1.5} />
        </button>
      </header>

      <div className="ssl-content">
        <h1 className="ssl-page-title">So sánh lãi suất ngân hàng</h1>

        {/* ── Input card ── */}
        <div className="ssl-card">
          <div className="ssl-card-title">Thông tin gửi tiết kiệm</div>
          <div className="ssl-inputs">

            {/* Số tiền */}
            <div className="ssl-input-row">
              <label className="ssl-input-label">Số tiền gửi</label>
              <div className="ssl-input-field">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nhập số tiền"
                  value={amountInput}
                  onChange={e => setAmountInput(formatInput(e.target.value))}
                  autoFocus
                />
                <span className="ssl-input-unit">đ</span>
              </div>
              <div className="ssl-chips">
                {AMOUNT_PRESETS.map(p => (
                  <button
                    key={p.val}
                    className={`ssl-chip${principal === p.val ? ' active' : ''}`}
                    onClick={() => setAmountInput(formatInput(String(p.val)))}
                  >{p.label}</button>
                ))}
              </div>
            </div>

            {/* Kỳ hạn */}
            <div className="ssl-input-row">
              <label className="ssl-input-label">Kỳ hạn</label>
              <div className="ssl-chips ssl-chips--term">
                {TERM_CHIPS.map(t => (
                  <button
                    key={t.val}
                    className={`ssl-chip ssl-chip--term${term === t.val ? ' active' : ''}`}
                    onClick={() => setTerm(t.val)}
                  >{t.label}</button>
                ))}
              </div>
            </div>

            {/* Gửi online toggle */}
            <div
              className="ssl-online-row"
              role="button"
              tabIndex={0}
              onClick={() => setOnline(v => !v)}
              onKeyDown={e => e.key === 'Enter' && setOnline(v => !v)}
            >
              <div className="ssl-online-text">
                <span className="ssl-online-label">Gửi online</span>
                <span className="ssl-online-desc">Lãi cao hơn quầy ~0.2%/năm</span>
              </div>
              <div className={`ssl-toggle-track${online ? ' on' : ''}`}>
                <div className="ssl-toggle-thumb" />
              </div>
            </div>

          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="ssl-filter-row">
          {FILTER_OPTS.map(f => (
            <button
              key={f.id}
              className={`ssl-filter-chip${filter === f.id ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}
            >{f.label}</button>
          ))}
        </div>

        {/* ── Result card ── */}
        <div className="ssl-card ssl-result">

          {/* Header row */}
          <div className="ssl-result-header">
            <span className="ssl-result-count">{ranked.length} ngân hàng · {termLabel}</span>
            {valid && topBank && (
              <span className="ssl-result-top">
                Cao nhất <strong>{topRate.toFixed(1)}%</strong>/năm
              </span>
            )}
          </div>

          {/* Table */}
          <div className="ssl-table">
            <div className="ssl-thead">
              <span className="ssl-th-rank">#</span>
              <span className="ssl-th-bank">Ngân hàng</span>
              <span className="ssl-th-rate">Lãi suất năm</span>
              {valid && <span className="ssl-th-interest">Tiền lãi</span>}
          </div>

            {ranked.map((b, i) => (
              <div
                key={b.id}
                className={`ssl-trow${i === 0 ? ' rank-1' : i === 1 ? ' rank-2' : i === 2 ? ' rank-3' : ''}`}
              >
                <span className="ssl-rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="ssl-rank-num">{i + 1}</span>}
                </span>
                <span className="ssl-bank-col">
                  <BankLogo bank={b} />
                  <span className="ssl-bank-info">
                    <span className="ssl-bank-name">{b.name}</span>
                    <span className="ssl-bank-type">{TYPE_LABELS[b.type]}</span>
                  </span>
                </span>
                <span className="ssl-rate-col">
                  <span className="ssl-rate-val">{b.rate.toFixed(1)}%</span>
                </span>
                {valid && (
                  <span className="ssl-interest-col">
                    <span className="ssl-interest-amt">+{fmtVND(b.interest)}</span>
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="ssl-updated">📅 Lãi suất tham khảo tháng 04/2026 — kiểm tra lại trên app ngân hàng trước khi gửi</div>
        </div>

        {/* ── Affiliate block ── */}
        {valid && (
          <AffiliateBlock
            tool="so-sanh-lai-suat"
            cta={{
              benefit: 'Mở tài khoản số — lãi suất cao hơn gửi quầy',
              contextLine: `Gửi ${fmtVND(principal)} kỳ hạn ${termLabel}, lãi cao nhất hiện tại ${topRate.toFixed(1)}%/năm.`,
            }}
            comparisonTitle="Ngân hàng số, lãi tốt hơn"
          />
        )}

        <div className="ssl-disclaimer">
          📌 Lãi suất mang tính tham khảo, thay đổi theo từng thời điểm. Thực tế phụ thuộc chính sách từng ngân hàng, số tiền gửi và kênh giao dịch.
        </div>

        <a
          className="ssl-cta"
          href="https://app.chilathu.com?utm_source=tienich.chilathu.com&utm_medium=tool&utm_campaign=ssl_footer"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAppCrosslink('so-sanh-lai-suat', { campaign: 'ssl_footer' })}
        >
          Theo dõi thu chi với Chilathu.com
          <HugeiconsIcon icon={LinkSquare01Icon} size={14} color="currentColor" strokeWidth={1.5} />
        </a>

        <div className="ssl-footer">© ChilàThu · Lãi suất tham khảo thị trường</div>
      </div>
    </div>
  )
}
