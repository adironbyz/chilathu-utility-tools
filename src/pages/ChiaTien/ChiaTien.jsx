import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo.jsx'
import SEO from '../../components/SEO.jsx'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare01Icon, Copy01Icon, LinkSquare01Icon } from '@hugeicons/core-free-icons'
import './ChiaTien.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _id = 1
function genId() { return String(_id++) }

// ─── LocalStorage persistence ─────────────────────────────────────────────────

const STORAGE_KEY = 'ct_session_v1'

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { members: [], expenses: [] }
    const data = JSON.parse(raw)
    // Bump ID counter above any saved IDs so new ones never clash
    const ids = [
      ...(data.members || []).map(m => parseInt(m.id) || 0),
      ...(data.expenses || []).map(e => parseInt(e.id) || 0),
    ]
    if (ids.length > 0) _id = Math.max(...ids) + 1
    return { members: data.members || [], expenses: data.expenses || [] }
  } catch {
    return { members: [], expenses: [] }
  }
}

function parseVND(v) {
  const n = parseInt((v || '').replace(/\./g, '').replace(/\D/g, ''), 10)
  return isNaN(n) || n <= 0 ? 0 : n
}

function formatInput(raw) {
  const digits = (raw || '').replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toLocaleString('vi-VN')
}

function fmtFull(n) {
  return Math.round(n).toLocaleString('vi-VN') + 'đ'
}

function fmtCompact(n) {
  return Math.round(n).toLocaleString('vi-VN') + 'đ'
}

// ─── Settlement algo ─────────────────────────────────────────────────────────

function calcSettlement(members, expenses) {
  const balance = {}
  members.forEach(m => (balance[m.id] = 0))

  expenses.forEach(exp => {
    if (!exp.amount || !exp.payerId || !balance.hasOwnProperty(exp.payerId)) return
    const pIds = exp.participantIds.length > 0
      ? exp.participantIds.filter(id => balance.hasOwnProperty(id))
      : members.map(m => m.id)
    if (pIds.length === 0) return
    const share = exp.amount / pIds.length
    balance[exp.payerId] += exp.amount
    pIds.forEach(id => { balance[id] -= share })
  })

  // Greedy min-transactions settlement
  const pos = Object.entries(balance).filter(([, v]) => v > 1).map(([id, amount]) => ({ id, amount }))
  const neg = Object.entries(balance).filter(([, v]) => v < -1).map(([id, amount]) => ({ id, amount: -amount }))
  pos.sort((a, b) => b.amount - a.amount)
  neg.sort((a, b) => b.amount - a.amount)

  const transactions = []
  let pi = 0, ni = 0
  while (pi < pos.length && ni < neg.length) {
    const transfer = Math.min(pos[pi].amount, neg[ni].amount)
    if (transfer > 1) transactions.push({ from: neg[ni].id, to: pos[pi].id, amount: transfer })
    pos[pi].amount -= transfer
    neg[ni].amount -= transfer
    if (pos[pi].amount < 1) pi++
    if (neg[ni].amount < 1) ni++
  }

  return { balance, transactions }
}

// ─── Presets ─────────────────────────────────────────────────────────────────

const TOTAL_PRESETS = [
  { label: '100k', val: 100_000   },
  { label: '200k', val: 200_000   },
  { label: '500k', val: 500_000   },
  { label: '1tr',  val: 1_000_000 },
  { label: '2tr',  val: 2_000_000 },
  { label: '5tr',  val: 5_000_000 },
]

const COUNT_PRESETS = [2, 3, 4, 5, 6, 8, 10]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChiaTien() {
  const navigate = useNavigate()

  const [splitMode,     setSplitMode]     = useState('even')  // 'even' | 'item'

  // Even mode
  const [totalInput, setTotalInput] = useState('')
  const [countStr,   setCountStr]   = useState('3')

  // Item mode — members
  const [members, setMembers] = useState(() => loadSession().members)
  const [newName, setNewName] = useState('')

  // Item mode — expenses
  const [expenses,      setExpenses]      = useState(() => loadSession().expenses)
  const [showForm,      setShowForm]      = useState(false)
  const [draftDesc,     setDraftDesc]     = useState('')
  const [draftAmtInput, setDraftAmtInput] = useState('')
  const [draftPayer,    setDraftPayer]    = useState(null)
  const [draftParts,    setDraftParts]    = useState([])   // empty = all members

  const [toastMsg,     setToastMsg]     = useState('')
  const [toastVis,     setToastVis]     = useState(false)
  const [toastUndo,    setToastUndo]    = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const toastTimer   = useRef(null)
  const confirmTimer = useRef(null)

  // ── Persist item-mode session to localStorage ─────────────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ members, expenses }))
  }, [members, expenses])

  function requestClear() {
    if (confirmClear) {
      clearTimeout(confirmTimer.current)
      setConfirmClear(false)
      clearSession()
    } else {
      setConfirmClear(true)
      confirmTimer.current = setTimeout(() => setConfirmClear(false), 3000)
    }
  }

  function clearSession() {
    const backup = { members: [...members], expenses: [...expenses] }
    setMembers([])
    setExpenses([])
    setShowForm(false)
    setDraftDesc('')
    setDraftAmtInput('')
    setDraftPayer(null)
    setDraftParts([])

    showToast('Đã xoá phiên', () => {
      setMembers(backup.members)
      setExpenses(backup.expenses)
      showToast('Đã hoàn tác')
    }, 4000)
  }

  // ── Even mode ────────────────────────────────────────────────────────────────

  const total     = parseVND(totalInput)
  const count     = parseInt(countStr) || 0
  const perPerson = total > 0 && count > 0 ? total / count : 0

  // ── Item mode ────────────────────────────────────────────────────────────────

  function addMember() {
    const name = newName.trim()
    if (!name || members.length >= 8) return
    setMembers(prev => [...prev, { id: genId(), name }])
    setNewName('')
  }

  function removeMember(id) {
    setMembers(prev => prev.filter(m => m.id !== id))
    setExpenses(prev => prev.map(e => ({
      ...e,
      payerId: e.payerId === id ? null : e.payerId,
      participantIds: e.participantIds.filter(p => p !== id),
    })).filter(e => e.payerId !== null))
    if (draftPayer === id) setDraftPayer(null)
    setDraftParts(prev => prev.filter(p => p !== id))
  }

  function addExpense() {
    const amount = parseVND(draftAmtInput)
    if (!amount || !draftPayer) return
    setExpenses(prev => [...prev, {
      id: genId(),
      desc: draftDesc.trim() || 'Chi tiêu',
      amount,
      payerId: draftPayer,
      participantIds: [...draftParts],
    }])
    setDraftDesc('')
    setDraftAmtInput('')
    setShowForm(false)
  }

  function toggleDraftPart(id) {
    if (draftParts.length === 0) {
      // currently "all" — deselect this one means explicit list without this one
      setDraftParts(members.map(m => m.id).filter(i => i !== id))
    } else if (draftParts.includes(id)) {
      const next = draftParts.filter(p => p !== id)
      // if next would be all members, reset to empty (= all)
      setDraftParts(next.length === members.length ? [] : next)
    } else {
      const next = [...draftParts, id]
      setDraftParts(next.length === members.length ? [] : next)
    }
  }

  const isPartSelected = id =>
    draftParts.length === 0 || draftParts.includes(id)

  const { balance, transactions } = useMemo(
    () => members.length > 0 && expenses.length > 0
      ? calcSettlement(members, expenses)
      : { balance: {}, transactions: [] },
    [members, expenses]
  )

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const memberName = id => members.find(m => m.id === id)?.name || '?'

  // ── Share / copy ─────────────────────────────────────────────────────────────

  function showToast(msg, undoFn = null, duration = 2200) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToastMsg(msg)
    setToastUndo(undoFn ? () => undoFn : null)
    setToastVis(true)
    toastTimer.current = setTimeout(() => {
      setToastVis(false)
      setToastUndo(null)
    }, duration)
  }

  function handleShareEven() {
    const p = new URLSearchParams({ t: total, c: countStr })
    navigator.clipboard.writeText(`${window.location.origin}/chia-tien?${p}`)
      .then(() => showToast('Đã copy link'))
  }

  function handleCopySettlement() {
    const allSettled = transactions.length === 0
    const lines = [
      `Chia tiền: ${members.map(m => m.name).join(', ')}`,
      `Tổng chi: ${fmtFull(totalExpenses)}`,
      '',
      ...(allSettled
        ? ['Mọi người đã hoà vốn 🎉']
        : transactions.map(t => `${memberName(t.from)} chuyển ${memberName(t.to)}: ${fmtFull(t.amount)}`)),
    ]
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => showToast('Đã copy kết quả'))
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="ct-page notebook-bg">
      <SEO
        title="Chia Tiền Nhóm — Tính ai chuyển cho ai"
        description="Chia tiền nhóm nhanh. Chia đều tổng tiền hoặc nhập từng món — tính ai chuyển cho ai, số tiền bao nhiêu."
        path="/chia-tien"
        keywords="chia tiền nhóm, tính ai trả, chia bill, split bill, chia tiền ăn"
      />

      <header className="ct-header">
        <Logo />
        <button className="ct-menu-btn" onClick={() => navigate('/')} aria-label="Tất cả công cụ">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={22} color="currentColor" strokeWidth={1.5} />
        </button>
      </header>

      <div className="ct-content">
        <h1 className="ct-page-title">Chia tiền nhóm</h1>

        {/* Mode tabs */}
        <div className="ct-mode-tabs">
          <button
            className={`ct-tab${splitMode === 'even' ? ' active' : ''}`}
            onClick={() => setSplitMode('even')}
          >Chia đều</button>
          <button
            className={`ct-tab${splitMode === 'item' ? ' active' : ''}`}
            onClick={() => setSplitMode('item')}
          >Theo món</button>
        </div>

        {/* ─── EVEN MODE ─────────────────────────────────────────────────── */}
        {splitMode === 'even' && (
          <>
            <div className="ct-card">
              <div className="ct-card-title">Thông tin</div>
              <div className="ct-inputs">

                <div className="ct-input-row">
                  <label className="ct-input-label">Tổng tiền</label>
                  <div className="ct-input-field">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Nhập tổng tiền"
                      value={totalInput}
                      onChange={e => setTotalInput(formatInput(e.target.value))}
                      autoFocus
                    />
                    <span className="ct-input-unit">đ</span>
                  </div>
                  <div className="ct-chips">
                    {TOTAL_PRESETS.map(p => (
                      <button
                        key={p.val}
                        className={`ct-chip${parseVND(totalInput) === p.val ? ' active' : ''}`}
                        onClick={() => setTotalInput(formatInput(String(p.val)))}
                      >{p.label}</button>
                    ))}
                  </div>
                </div>

                <div className="ct-input-row">
                  <label className="ct-input-label">Số người</label>
                  <div className="ct-stepper-row">
                    <button
                      className="ct-stepper-btn"
                      onClick={() => setCountStr(String(Math.max(2, count - 1)))}
                      disabled={count <= 2}
                    >−</button>
                    <span className="ct-stepper-val">{count}</span>
                    <button
                      className="ct-stepper-btn"
                      onClick={() => setCountStr(String(Math.min(50, count + 1)))}
                    >+</button>
                  </div>
                  <div className="ct-chips">
                    {COUNT_PRESETS.map(v => (
                      <button
                        key={v}
                        className={`ct-chip${count === v ? ' active' : ''}`}
                        onClick={() => setCountStr(String(v))}
                      >{v} người</button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {perPerson > 0 && (
              <div className="ct-card ct-result">
                <div className="ct-sum-hero">
                  <span className="ct-sum-hero-label">Mỗi người trả</span>
                  <span className="ct-sum-hero-val">{fmtFull(perPerson)}</span>
                </div>
                <div className="ct-sum-rows">
                  <div className="ct-sum-row">
                    <span className="ct-sum-label">Tổng tiền</span>
                    <span className="ct-sum-val">{fmtFull(total)}</span>
                  </div>
                  <div className="ct-sum-row">
                    <span className="ct-sum-label">Số người</span>
                    <span className="ct-sum-val">{count} người</span>
                  </div>
                </div>
                <div className="ct-actions">
                  <button className="ct-btn-share" onClick={handleShareEven}>
                    <HugeiconsIcon icon={Copy01Icon} size={16} color="currentColor" strokeWidth={2} />
                    Copy link kết quả
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── ITEM MODE ─────────────────────────────────────────────────── */}
        {splitMode === 'item' && (
          <>
            {/* Members */}
            <div className="ct-card">
              <div className="ct-card-title-row">
                <span className="ct-card-title">Thành viên {members.length > 0 && `(${members.length}/8)`}</span>
                {members.length > 0 && (
                  <button
                    className={`ct-clear-btn${confirmClear ? ' confirm' : ''}`}
                    onClick={requestClear}
                  >{confirmClear ? 'Xác nhận?' : 'Xoá phiên'}</button>
                )}
              </div>
              <div className="ct-inputs">
                {members.length > 0 && (
                  <div className="ct-member-chips">
                    {members.map(m => (
                      <div key={m.id} className="ct-member-chip">
                        {m.name}
                        <button className="ct-member-remove" onClick={() => removeMember(m.id)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                {members.length < 8 && (
                  <div className="ct-add-member-row">
                    <div className="ct-input-field ct-member-input-field">
                      <input
                        type="text"
                        placeholder="Tên thành viên"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addMember()}
                        maxLength={20}
                      />
                    </div>
                    <button
                      className="ct-add-btn"
                      onClick={addMember}
                      disabled={!newName.trim()}
                    >Thêm</button>
                  </div>
                )}
                {members.length === 0 && (
                  <p className="ct-hint">Thêm ít nhất 2 người để bắt đầu</p>
                )}
              </div>
            </div>

            {/* Expenses */}
            {members.length >= 2 && (
              <div className="ct-card">
                <div className="ct-card-title">
                  Chi tiêu {expenses.length > 0 && `· ${fmtCompact(totalExpenses)}`}
                </div>

                {expenses.length > 0 && (
                  <div className="ct-expense-list">
                    {expenses.map(e => {
                      const payer = memberName(e.payerId)
                      const parts = e.participantIds.length
                        ? e.participantIds.map(id => memberName(id)).join(', ')
                        : 'Tất cả'
                      return (
                        <div key={e.id} className="ct-expense-item">
                          <div className="ct-expense-left">
                            <span className="ct-expense-desc">{e.desc}</span>
                            <span className="ct-expense-meta">{payer} trả · {parts}</span>
                          </div>
                          <div className="ct-expense-right">
                            <span className="ct-expense-amount">{fmtCompact(e.amount)}</span>
                            <button className="ct-expense-remove" onClick={() => setExpenses(prev => prev.filter(x => x.id !== e.id))}>×</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add form */}
                {showForm ? (
                  <div className="ct-add-form">
                    <div className="ct-input-row">
                      <label className="ct-input-label">Tên khoản (tuỳ chọn)</label>
                      <div className="ct-input-field">
                        <input
                          type="text"
                          placeholder="VD: Ăn tối, Khách sạn..."
                          value={draftDesc}
                          onChange={e => setDraftDesc(e.target.value)}
                          maxLength={40}
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="ct-input-row">
                      <label className="ct-input-label">Số tiền</label>
                      <div className="ct-input-field">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Nhập số tiền"
                          value={draftAmtInput}
                          onChange={e => setDraftAmtInput(formatInput(e.target.value))}
                        />
                        <span className="ct-input-unit">đ</span>
                      </div>
                    </div>

                    <div className="ct-input-row">
                      <label className="ct-input-label">Ai trả</label>
                      <div className="ct-person-chips">
                        {members.map(m => (
                          <button
                            key={m.id}
                            className={`ct-person-chip payer${draftPayer === m.id ? ' active' : ''}`}
                            onClick={() => setDraftPayer(m.id)}
                          >{m.name}</button>
                        ))}
                      </div>
                    </div>

                    <div className="ct-input-row">
                      <label className="ct-input-label">
                        Chia cho {draftParts.length === 0 ? '(Tất cả)' : `(${draftParts.length} người)`}
                      </label>
                      <div className="ct-person-chips">
                        {members.map(m => (
                          <button
                            key={m.id}
                            className={`ct-person-chip part${isPartSelected(m.id) ? ' active' : ''}`}
                            onClick={() => toggleDraftPart(m.id)}
                          >{m.name}</button>
                        ))}
                      </div>
                    </div>

                    <div className="ct-form-actions">
                      <button className="ct-btn-cancel" onClick={() => { setShowForm(false); setDraftDesc(''); setDraftAmtInput('') }}>
                        Huỷ
                      </button>
                      <button
                        className="ct-btn-add-expense"
                        onClick={addExpense}
                        disabled={!parseVND(draftAmtInput) || !draftPayer}
                      >Thêm</button>
                    </div>
                  </div>
                ) : (
                  <button className="ct-add-expense-btn" onClick={() => { setShowForm(true); setDraftPayer(members[0]?.id || null) }}>
                    + Thêm chi tiêu
                  </button>
                )}
              </div>
            )}

            {/* Results */}
            {members.length >= 2 && expenses.length > 0 && (
              <div className="ct-card ct-result">
                <div className="ct-sum-hero">
                  <span className="ct-sum-hero-label">Tổng chi tiêu</span>
                  <span className="ct-sum-hero-val">{fmtFull(totalExpenses)}</span>
                </div>

                {transactions.length === 0 ? (
                  <div className="ct-settled">
                    🎉 Mọi người đã hoà vốn — không cần chuyển tiền!
                  </div>
                ) : (
                  <>
                    <div className="ct-sec-label">Cần chuyển tiền</div>
                    <div className="ct-transactions">
                      {transactions.map((t, i) => (
                        <div key={i} className="ct-transaction">
                          <span className="ct-txn-from">{memberName(t.from)}</span>
                          <span className="ct-txn-arrow">→</span>
                          <span className="ct-txn-to">{memberName(t.to)}</span>
                          <span className="ct-txn-amount">{fmtFull(t.amount)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="ct-sec-label">Số dư mỗi người</div>
                    <div className="ct-balance-list">
                      {members.map(m => {
                        const bal = balance[m.id] || 0
                        return (
                          <div key={m.id} className="ct-balance-row">
                            <span className="ct-balance-name">{m.name}</span>
                            <span className={`ct-balance-val${bal > 1 ? ' pos' : bal < -1 ? ' neg' : ''}`}>
                              {Math.abs(bal) < 1 ? 'Hoà vốn'
                                : bal > 0 ? `+${fmtFull(bal)}`
                                : fmtFull(bal)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                <div className="ct-actions">
                  <button className="ct-btn-share" onClick={handleCopySettlement}>
                    <HugeiconsIcon icon={Copy01Icon} size={16} color="currentColor" strokeWidth={2} />
                    Copy kết quả
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <a
          className="ct-cta"
          href="https://app.chilathu.com?utm_source=tienich.chilathu.com&utm_medium=tool&utm_campaign=chiaTien_footer"
          target="_blank"
          rel="noopener noreferrer"
        >
          Theo dõi thu chi với Chilathu.com
          <HugeiconsIcon icon={LinkSquare01Icon} size={14} color="currentColor" strokeWidth={1.5} />
        </a>

        <div className="ct-footer">© ChilàThu</div>
      </div>

      <div className={`ct-toast${toastVis ? ' show' : ''}${toastUndo ? ' ct-toast--action' : ''}`}>
        <span>{toastMsg}</span>
        {toastUndo && (
          <button
            className="ct-toast-undo"
            onClick={() => { toastUndo(); setToastVis(false); setToastUndo(null) }}
          >Hoàn tác</button>
        )}
      </div>
    </div>
  )
}
