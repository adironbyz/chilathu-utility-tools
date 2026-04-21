import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo.jsx'
import SEO from '../../components/SEO.jsx'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare01Icon, Link01Icon, LinkSquare01Icon } from '@hugeicons/core-free-icons'
import { AffiliateBlock } from '../../components/affiliate/index.js'
import '../../components/affiliate/Affiliate.css'
import { trackAppCrosslink, trackToolCalculateDone } from '../../lib/analytics.js'
import './TinhLaiVay.css'

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

function parseRate(s) {
  return parseFloat((s || '').replace(',', '.')) || 0
}

function fmtCompact(n) {
  return Math.round(n).toLocaleString('vi-VN') + 'đ'
}

function fmtFull(n) {
  return Math.round(n).toLocaleString('vi-VN') + 'đ'
}

// ─── Mode configs ─────────────────────────────────────────────────────────────

const MODES = {
  quick: {
    label: 'Vay nhanh',
    hint:  'Vay tiền mặt, cầm đồ — lãi tính trên gốc ban đầu, cố định mỗi tháng',
    method: 'simple',
    unit:   'm',
    defaultRate: '2',
    defaultTerm: '6',
    ratePresets: [
      { label: '1%',   val: 1   },
      { label: '1,5%', val: 1.5 },
      { label: '2%',   val: 2   },
      { label: '3%',   val: 3   },
    ],
    termPresets: [
      { label: '1T',  val: 1  },
      { label: '3T',  val: 3  },
      { label: '6T',  val: 6  },
      { label: '12T', val: 12 },
    ],
    principalPresets: [
      { label: '5tr',   val: 5_000_000   },
      { label: '10tr',  val: 10_000_000  },
      { label: '30tr',  val: 30_000_000  },
      { label: '50tr',  val: 50_000_000  },
      { label: '100tr', val: 100_000_000 },
      { label: '200tr', val: 200_000_000 },
    ],
  },
  home: {
    label: 'Mua nhà',
    hint:  'Vay ngân hàng mua nhà — dư nợ giảm dần, hỗ trợ lãi cố định + thả nổi',
    method: 'reducing',
    unit:   'y',
    defaultRate: '8,5',
    defaultTerm: '240',
    ratePresets: [
      { label: '8%',    val: 8    },
      { label: '8,5%',  val: 8.5  },
      { label: '10%',   val: 10   },
      { label: '12%',   val: 12   },
    ],
    termPresets: [
      { label: '5 năm',  val: 60  },
      { label: '10 năm', val: 120 },
      { label: '15 năm', val: 180 },
      { label: '20 năm', val: 240 },
      { label: '25 năm', val: 300 },
    ],
    principalPresets: [
      { label: '500tr', val: 500_000_000   },
      { label: '1 tỷ',  val: 1_000_000_000 },
      { label: '1,5 tỷ',val: 1_500_000_000 },
      { label: '2 tỷ',  val: 2_000_000_000 },
      { label: '3 tỷ',  val: 3_000_000_000 },
      { label: '5 tỷ',  val: 5_000_000_000 },
    ],
  },
  car: {
    label: 'Mua xe',
    hint:  'Vay ngân hàng mua xe — dư nợ giảm dần',
    method: 'reducing',
    unit:   'y',
    defaultRate: '9',
    defaultTerm: '48',
    ratePresets: [
      { label: '8%',  val: 8  },
      { label: '9%',  val: 9  },
      { label: '10%', val: 10 },
      { label: '12%', val: 12 },
    ],
    termPresets: [
      { label: '12T', val: 12 },
      { label: '24T', val: 24 },
      { label: '36T', val: 36 },
      { label: '48T', val: 48 },
      { label: '60T', val: 60 },
    ],
    principalPresets: [
      { label: '200tr',  val: 200_000_000  },
      { label: '300tr',  val: 300_000_000  },
      { label: '500tr',  val: 500_000_000  },
      { label: '700tr',  val: 700_000_000  },
      { label: '1 tỷ',   val: 1_000_000_000 },
      { label: '1,5 tỷ', val: 1_500_000_000 },
    ],
  },
  consumer: {
    label: 'Vay tiêu dùng',
    hint:  'FE Credit, Home Credit, ngân hàng — dư nợ giảm dần',
    method: 'reducing',
    unit:   'y',
    defaultRate: '20',
    defaultTerm: '24',
    ratePresets: [
      { label: '15%', val: 15 },
      { label: '20%', val: 20 },
      { label: '25%', val: 25 },
      { label: '30%', val: 30 },
    ],
    termPresets: [
      { label: '6T',  val: 6  },
      { label: '12T', val: 12 },
      { label: '18T', val: 18 },
      { label: '24T', val: 24 },
      { label: '36T', val: 36 },
    ],
    principalPresets: [
      { label: '10tr',  val: 10_000_000  },
      { label: '20tr',  val: 20_000_000  },
      { label: '50tr',  val: 50_000_000  },
      { label: '100tr', val: 100_000_000 },
      { label: '200tr', val: 200_000_000 },
      { label: '300tr', val: 300_000_000 },
    ],
  },
}

const TABLE_PREVIEW = 24

// ─── Calculations ─────────────────────────────────────────────────────────────

function calcReducing(principal, monthlyRate, months) {
  const r = monthlyRate / 100
  const payment = r === 0
    ? principal / months
    : principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1)
  let bal = principal
  const rows = []
  for (let i = 1; i <= months; i++) {
    const interest      = bal * r
    const principalPart = Math.min(payment - interest, bal)
    bal = Math.max(0, bal - principalPart)
    rows.push({ month: i, principalPart, interest, payment, balance: bal })
  }
  return rows
}

function calcSimple(principal, monthlyRate, months) {
  const r                = monthlyRate / 100
  const monthlyInterest  = principal * r
  const monthlyPrincipal = principal / months
  const payment          = monthlyPrincipal + monthlyInterest
  const rows = []
  for (let i = 1; i <= months; i++) {
    rows.push({
      month: i,
      principalPart: monthlyPrincipal,
      interest: monthlyInterest,
      payment,
      balance: Math.max(0, principal - monthlyPrincipal * i),
    })
  }
  return rows
}

// Mua nhà: lãi cố định N tháng đầu, thả nổi phần còn lại
function calcMixed(principal, fixedRateAnnual, fixedMonths, floatRateAnnual, totalMonths) {
  const r1 = fixedRateAnnual / 100 / 12
  const r2 = floatRateAnnual / 100 / 12
  const n  = totalMonths
  const n1 = Math.min(fixedMonths, n)
  const n2 = n - n1

  // Payment phase 1: amortize full term at fixed rate
  const p1 = r1 === 0
    ? principal / n
    : principal * r1 * Math.pow(1 + r1, n) / (Math.pow(1 + r1, n) - 1)

  let bal = principal
  const rows = []

  for (let i = 1; i <= n1; i++) {
    const interest      = bal * r1
    const principalPart = Math.min(p1 - interest, bal)
    bal = Math.max(0, bal - principalPart)
    rows.push({ month: i, principalPart, interest, payment: p1, balance: bal, phase: 1 })
  }

  if (n2 > 0 && bal > 0) {
    // Payment phase 2: recalculate on remaining balance
    const p2 = r2 === 0
      ? bal / n2
      : bal * r2 * Math.pow(1 + r2, n2) / (Math.pow(1 + r2, n2) - 1)

    for (let i = n1 + 1; i <= n; i++) {
      const interest      = bal * r2
      const principalPart = Math.min(p2 - interest, bal)
      bal = Math.max(0, bal - principalPart)
      rows.push({ month: i, principalPart, interest, payment: p2, balance: bal, phase: 2 })
    }
  }

  return rows
}

// ─── Share URL ────────────────────────────────────────────────────────────────

function encodeShareUrl(params) {
  const p = new URLSearchParams(params)
  return `${window.location.origin}/tinh-lai-vay?${p.toString()}`
}

function readShareParams() {
  const p    = new URLSearchParams(window.location.search)
  const mode = Object.keys(MODES).includes(p.get('mode')) ? p.get('mode') : 'quick'
  const cfg  = MODES[mode]
  return {
    mode,
    principalInput: p.get('p')  ? formatInput(p.get('p')) : '',
    rateStr:        p.get('r')  || cfg.defaultRate,
    termStr:        p.get('t')  || cfg.defaultTerm,
    mixed:          p.get('mx') === '1',
    floatRateStr:   p.get('fr') || '11',
    fixedMonthsStr: p.get('fm') || '24',
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TinhLaiVay() {
  const navigate = useNavigate()
  const init     = readShareParams()

  const [mode,           setModeState]    = useState(init.mode)
  const [principalInput, setPrincipal]    = useState(init.principalInput)
  const [rateStr,        setRateStr]      = useState(init.rateStr)
  const [termStr,        setTermStr]      = useState(init.termStr)
  const [mixed,          setMixed]        = useState(init.mixed)        // home only
  const [floatRateStr,   setFloatRateStr] = useState(init.floatRateStr)
  const [fixedMonthsStr, setFixedMonths]  = useState(init.fixedMonthsStr)
  const [expanded,       setExpanded]     = useState(false)
  const [toastMsg,       setToastMsg]     = useState('')
  const [toastVis,       setToastVis]     = useState(false)

  const cfg = MODES[mode]

  // When switching mode: reset rate/term to new defaults, keep principal
  function switchMode(newMode) {
    const c = MODES[newMode]
    setModeState(newMode)
    setRateStr(c.defaultRate)
    setTermStr(c.defaultTerm)
    setMixed(false)
    setExpanded(false)
  }

  const principal    = parseVND(principalInput)
  const rateVal      = parseRate(rateStr)         // %/năm or %/tháng
  const months       = parseInt(termStr) || 0
  const floatRate    = parseRate(floatRateStr)
  const fixedMonths  = parseInt(fixedMonthsStr) || 0

  // Effective monthly rate (home/car/consumer = %/năm, quick = %/tháng)
  const monthlyRate  = cfg.unit === 'y' ? rateVal / 12 : rateVal
  const isMixed      = mode === 'home' && mixed

  const valid = principal > 0 && rateVal > 0 && months > 0
    && (!isMixed || (floatRate > 0 && fixedMonths > 0 && fixedMonths < months))

  const rows = useMemo(() => {
    if (!valid) return []
    if (isMixed)               return calcMixed(principal, rateVal, fixedMonths, floatRate, months)
    if (cfg.method === 'simple')   return calcSimple(principal, monthlyRate, months)
    return calcReducing(principal, monthlyRate, months)
  }, [valid, principal, rateVal, monthlyRate, months, isMixed, floatRate, fixedMonths, cfg.method])

  const totalInterest  = rows.reduce((s, r) => s + r.interest, 0)
  const totalPayment   = rows.reduce((s, r) => s + r.payment,  0)
  const phase1Payment  = isMixed && rows.find(r => r.phase === 1)?.payment
  const phase2Payment  = isMixed && rows.find(r => r.phase === 2)?.payment
  const monthlyPayment = !isMixed && rows[0] ? rows[0].payment : null

  const visibleRows = expanded ? rows : rows.slice(0, TABLE_PREVIEW)
  const hiddenCount = rows.length - TABLE_PREVIEW

  // Fire `tool_calculate_done` 1 lần khi user lần đầu có result valid trong session.
  const calcFiredRef = useRef(false)
  useEffect(() => {
    if (valid && rows.length > 0 && !calcFiredRef.current) {
      trackToolCalculateDone('tinh-lai-vay')
      calcFiredRef.current = true
    }
  }, [valid, rows.length])

  const handleShare = useCallback(() => {
    const params = { mode, p: principal, r: rateStr, t: termStr }
    if (isMixed) { params.mx = '1'; params.fr = floatRateStr; params.fm = fixedMonthsStr }
    navigator.clipboard.writeText(encodeShareUrl(params)).then(() => {
      setToastMsg('Đã copy link — paste để chia sẻ')
      setToastVis(true)
      setTimeout(() => setToastVis(false), 2200)
    })
  }, [mode, principal, rateStr, termStr, isMixed, floatRateStr, fixedMonthsStr])

  return (
    <div className="tlv-page notebook-bg">
      <SEO
        title="Tính Lãi Vay Ngân Hàng — Mua nhà, Mua xe, Vay tiêu dùng"
        description="Tính lãi vay ngân hàng, tài chính tiêu dùng. Chọn loại vay: mua nhà, mua xe, vay tiêu dùng, vay nhanh. Hỗ trợ lãi cố định + thả nổi cho vay mua nhà."
        path="/tinh-lai-vay"
        keywords="tính lãi vay, lãi suất vay ngân hàng, vay mua nhà, vay mua xe, vay tiêu dùng, dư nợ giảm dần"
      />

      <header className="tlv-header">
        <Logo />
        <button className="tlv-menu-btn" onClick={() => navigate('/')} aria-label="Tất cả công cụ">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={22} color="currentColor" strokeWidth={1.5} />
        </button>
      </header>

      <div className="tlv-content">
        <h1 className="tlv-page-title">Tính lãi vay ngân hàng, Cty tài chính</h1>

        {/* ── Input card ── */}
        <div className="tlv-card">
          <div className="tlv-card-title">Loại vay</div>
          <div className="tlv-inputs">

            {/* Mode grid */}
            <div className="tlv-mode-grid">
              {Object.entries(MODES).map(([id, c]) => (
                <button
                  key={id}
                  className={`tlv-mode-card${mode === id ? ' active' : ''}`}
                  onClick={() => switchMode(id)}
                >{c.label}</button>
              ))}
            </div>
            <div className="tlv-method-hint">{cfg.hint}</div>

            {/* Số tiền vay */}
            <div className="tlv-input-row">
              <label className="tlv-input-label">Số tiền vay</label>
              <div className="tlv-input-field">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nhập số tiền"
                  value={principalInput}
                  onChange={e => setPrincipal(formatInput(e.target.value))}
                  autoFocus
                />
                <span className="tlv-input-unit">đ</span>
              </div>
              <div className="tlv-rate-chips">
                {cfg.principalPresets.map(p => (
                  <button
                    key={p.val}
                    className={`tlv-rate-chip${parseVND(principalInput) === p.val ? ' active' : ''}`}
                    onClick={() => setPrincipal(formatInput(String(p.val)))}
                  >{p.label}</button>
                ))}
              </div>
            </div>

            {/* Lãi suất */}
            <div className="tlv-input-row">
              <label className="tlv-input-label">
                Lãi suất{isMixed ? ' cố định' : ''} ({cfg.unit === 'y' ? '%/năm' : '%/tháng'})
              </label>
              <div className="tlv-input-field">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={cfg.defaultRate}
                  value={rateStr}
                  onChange={e => setRateStr(e.target.value.replace(/[^0-9,\.]/g, ''))}
                />
                <span className="tlv-input-unit">%{cfg.unit === 'y' ? '/năm' : '/tháng'}</span>
              </div>
              <div className="tlv-rate-chips">
                {cfg.ratePresets.map(r => (
                  <button
                    key={r.val}
                    className={`tlv-rate-chip${parseRate(rateStr) === r.val ? ' active' : ''}`}
                    onClick={() => setRateStr(String(r.val).replace('.', ','))}
                  >{r.label}</button>
                ))}
              </div>
            </div>

            {/* Mua nhà: toggle lãi hỗn hợp */}
            {mode === 'home' && (
              <button
                className={`tlv-mixed-toggle${mixed ? ' active' : ''}`}
                onClick={() => setMixed(v => !v)}
              >
                <span className="tlv-mixed-check">{mixed ? '✓' : '+'}</span>
                Lãi hỗn hợp — cố định rồi thả nổi
              </button>
            )}

            {/* Lãi hỗn hợp inputs */}
            {isMixed && (
              <div className="tlv-mixed-box">
                <div className="tlv-input-row">
                  <label className="tlv-input-label">Cố định trong</label>
                  <div className="tlv-mixed-row">
                    <div className="tlv-input-field tlv-mixed-input">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="24"
                        value={fixedMonthsStr}
                        onChange={e => setFixedMonths(e.target.value.replace(/\D/g, ''))}
                      />
                      <span className="tlv-input-unit">tháng</span>
                    </div>
                    <div className="tlv-rate-chips" style={{ flex: 1 }}>
                      {[12, 24, 36].map(v => (
                        <button
                          key={v}
                          className={`tlv-rate-chip${parseInt(fixedMonthsStr) === v ? ' active' : ''}`}
                          onClick={() => setFixedMonths(String(v))}
                        >{v}T</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="tlv-input-row">
                  <label className="tlv-input-label">Lãi thả nổi sau đó (%/năm)</label>
                  <div className="tlv-input-field">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="11"
                      value={floatRateStr}
                      onChange={e => setFloatRateStr(e.target.value.replace(/[^0-9,\.]/g, ''))}
                    />
                    <span className="tlv-input-unit">%/năm</span>
                  </div>
                  <div className="tlv-rate-chips">
                    {[10, 11, 12, 13].map(v => (
                      <button
                        key={v}
                        className={`tlv-rate-chip${parseRate(floatRateStr) === v ? ' active' : ''}`}
                        onClick={() => setFloatRateStr(String(v))}
                      >{v}%</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Thời hạn */}
            <div className="tlv-input-row">
              <label className="tlv-input-label">Thời hạn vay</label>
              <div className="tlv-input-field">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Số tháng"
                  value={termStr}
                  onChange={e => setTermStr(e.target.value.replace(/\D/g, ''))}
                />
                <span className="tlv-input-unit">tháng</span>
              </div>
              <div className="tlv-rate-chips">
                {cfg.termPresets.map(t => (
                  <button
                    key={t.val}
                    className={`tlv-rate-chip${parseInt(termStr) === t.val ? ' active' : ''}`}
                    onClick={() => setTermStr(String(t.val))}
                  >{t.label}</button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── Result card ── */}
        <div className="tlv-card tlv-result">

          {!valid && (
            <div className="tlv-empty">
              <span className="tlv-empty-arrow">↑</span>
              <span>Nhập thông tin khoản vay để tính</span>
            </div>
          )}

          {valid && rows.length > 0 && (
            <>
              {/* Summary */}
              <div className="tlv-summary">
                {/* Normal mode: single monthly payment */}
                {monthlyPayment !== null && (
                  <div className="tlv-sum-hero">
                    <span className="tlv-sum-hero-label">Trả mỗi tháng</span>
                    <span className="tlv-sum-hero-val">{fmtFull(monthlyPayment)}</span>
                  </div>
                )}
                {/* Mixed mode: 2 phases */}
                {isMixed && phase1Payment && (
                  <div className="tlv-sum-hero">
                    <div className="tlv-sum-phase-row">
                      <div className="tlv-sum-phase">
                        <span className="tlv-sum-phase-badge">{fixedMonthsStr}T đầu</span>
                        <span className="tlv-sum-phase-val">{fmtFull(phase1Payment)}/tháng</span>
                      </div>
                      <div className="tlv-sum-phase">
                        <span className="tlv-sum-phase-badge phase2">Sau đó</span>
                        <span className="tlv-sum-phase-val phase2">{phase2Payment ? fmtFull(phase2Payment) : '—'}/tháng</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="tlv-sum-rows">
                  <div className="tlv-sum-row">
                    <span className="tlv-sum-label">Tổng lãi phải trả</span>
                    <span className="tlv-sum-val tlv-red">{fmtFull(totalInterest)}</span>
                  </div>
                  <div className="tlv-sum-row">
                    <span className="tlv-sum-label">Tổng tiền phải trả</span>
                    <span className="tlv-sum-val">{fmtFull(totalPayment)}</span>
                  </div>
                  <div className="tlv-sum-row">
                    <span className="tlv-sum-label">Lãi / gốc</span>
                    <span className="tlv-sum-val">{((totalInterest / principal) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="tlv-sec-label">
                Lịch trả nợ
                {expanded && (
                  <span className="tlv-sec-count">{rows.length} tháng</span>
                )}
              </div>

              {/* Collapsed: first 24 rows inline */}
              {!expanded && (
                <div className="tlv-table tlv-table--4">
                  <div className="tlv-thead">
                    <span>Tháng</span><span>Gốc</span><span>Lãi</span><span>Dư nợ</span>
                  </div>
                  {rows.slice(0, TABLE_PREVIEW).map((r, i) => {
                    const prevPhase = i > 0 ? rows[i - 1].phase : null
                    const showSep   = isMixed && r.phase === 2 && prevPhase === 1
                    return (
                      <>
                        {showSep && (
                          <div key={`sep-${r.month}`} className="tlv-phase-sep">
                            ↓ Lãi thả nổi {floatRateStr}%/năm từ tháng {r.month}
                          </div>
                        )}
                        <div key={r.month} className={`tlv-trow${r.phase === 2 ? ' phase2' : ''}`}>
                          <span className="tlv-tm">T{r.month}</span>
                          <span className="tlv-tp">{fmtCompact(r.principalPart)}</span>
                          <span className="tlv-ti">{fmtCompact(r.interest)}</span>
                          <span className={`tlv-tb${r.balance <= 0 ? ' zero' : ''}`}>
                            {r.balance <= 0 ? 'Hết nợ' : fmtCompact(r.balance)}
                          </span>
                        </div>
                      </>
                    )
                  })}
                </div>
              )}

              {hiddenCount > 0 && !expanded && (
                <button className="tlv-expand-btn" onClick={() => setExpanded(true)}>
                  Xem thêm {hiddenCount} tháng ↓
                </button>
              )}

              {/* Expanded: scrollable container, sticky thead */}
              {expanded && (
                <div className="tlv-table-scroll">
                  <div className="tlv-table tlv-table--4 tlv-table--scroll">
                    <div className="tlv-thead tlv-thead--sticky">
                      <span>Tháng</span><span>Gốc</span><span>Lãi</span><span>Dư nợ</span>
                    </div>
                    {rows.map((r, i) => {
                      const prevPhase = i > 0 ? rows[i - 1].phase : null
                      const showSep   = isMixed && r.phase === 2 && prevPhase === 1
                      return (
                        <>
                          {showSep && (
                            <div key={`sep-${r.month}`} className="tlv-phase-sep">
                              ↓ Lãi thả nổi {floatRateStr}%/năm từ tháng {r.month}
                            </div>
                          )}
                          <div key={r.month} className={`tlv-trow${r.phase === 2 ? ' phase2' : ''}`}>
                            <span className="tlv-tm">T{r.month}</span>
                            <span className="tlv-tp">{fmtCompact(r.principalPart)}</span>
                            <span className="tlv-ti">{fmtCompact(r.interest)}</span>
                            <span className={`tlv-tb${r.balance <= 0 ? ' zero' : ''}`}>
                              {r.balance <= 0 ? 'Hết nợ' : fmtCompact(r.balance)}
                            </span>
                          </div>
                        </>
                      )
                    })}
                  </div>
                  <button className="tlv-expand-btn tlv-collapse-btn" onClick={() => setExpanded(false)}>
                    ↑ Thu gọn
                  </button>
                </div>
              )}

              <div className="tlv-actions">
                <button className="tlv-btn-share" onClick={handleShare}>
                  <HugeiconsIcon icon={Link01Icon} size={16} color="currentColor" strokeWidth={2} />
                  Copy link kết quả
                </button>
              </div>
            </>
          )}
        </div>

        {valid && mode !== 'home' && monthlyPayment && (
          <AffiliateBlock
            tool="tinh-lai-vay"
            cta={{
              benefit:
                mode === 'quick'
                  ? 'Cần vay gấp? Duyệt trong 5 phút'
                  : mode === 'car'
                  ? 'Vay tín chấp mua xe — hạn mức tới 1 tỷ'
                  : 'Vay tiêu dùng nhanh hơn — lãi suất ngân hàng',
              contextLine: `Khoản ${fmtFull(principal)}, trả ~${fmtFull(monthlyPayment)}/tháng.`,
            }}
            comparisonTitle="Cân nhắc thêm các bên khác"
          />
        )}

        {valid && (
          <div className="tlv-disclaimer">
            📌 Kết quả mang tính tham khảo. Lãi suất thực tế, phí trả trước hạn và điều kiện vay phụ thuộc hợp đồng với tổ chức tín dụng.
          </div>
        )}

        <a
          className="tlv-cta"
          href="https://app.chilathu.com?utm_source=tienich.chilathu.com&utm_medium=tool&utm_campaign=tlv_footer"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAppCrosslink('tinh-lai-vay', { campaign: 'tlv_footer' })}
        >
          Theo dõi thu chi với Chilathu.com
          <HugeiconsIcon icon={LinkSquare01Icon} size={14} color="currentColor" strokeWidth={1.5} />
        </a>

        <div className="tlv-footer">© ChilàThu · Lãi suất tham khảo thị trường</div>
      </div>

      <div className={`tlv-toast${toastVis ? ' show' : ''}`}>{toastMsg}</div>
    </div>
  )
}
