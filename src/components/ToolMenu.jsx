import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import './ToolMenu.css'

const TOOLS = [
  { slug: 'tinh-tien-dien',   emoji: '⚡', label: 'Tiền điện',      available: true  },
  { slug: 'tinh-tien-nuoc',   emoji: '💧', label: 'Tiền nước',      available: false },
  { slug: 'tinh-luong',       emoji: '💰', label: 'Tính lương',     available: false },
  { slug: 'tinh-lai-vay',     emoji: '🏦', label: 'Lãi vay',        available: false },
  { slug: 'tra-gop',          emoji: '📅', label: 'Trả góp',        available: false },
  { slug: 'chia-tien',        emoji: '👥', label: 'Chia tiền',      available: false },
  { slug: 'chia-bill',        emoji: '🍜', label: 'Chia bill',      available: false },
  { slug: 'lai-the-tin-dung', emoji: '💳', label: 'Lãi thẻ',       available: false },
  { slug: 'mua-duoc-khong',   emoji: '🏠', label: 'Mua được không', available: false },
  { slug: 'tiet-kiem',        emoji: '🎯', label: 'Tiết kiệm',      available: false },
  { slug: 'chi-phi-du-lich',  emoji: '✈️', label: 'Du lịch',        available: false },
  { slug: 'quy-khan-cap',     emoji: '🛡️', label: 'Quỹ khẩn cấp',  available: false },
]

export function ToolMenu({ open, onClose }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const activePath = location.pathname.replace('/', '')

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else       document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handle = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [open, onClose])

  function handleTool(tool) {
    if (!tool.available) return
    onClose()
    navigate(`/${tool.slug}`)
  }

  return (
    <div className={`tmenu-overlay${open ? ' open' : ''}`} onClick={onClose} aria-modal="true" role="dialog">
      <div className="tmenu-sheet" onClick={e => e.stopPropagation()}>
        <div className="tmenu-handle" />
        <div className="tmenu-header">
          <span className="tmenu-title">Công cụ tiện ích</span>
          <button className="tmenu-close" onClick={onClose} aria-label="Đóng">
            <HugeiconsIcon icon={Cancel01Icon} size={16} color="currentColor" strokeWidth={2} />
          </button>
        </div>
        <div className="tmenu-grid">
          {TOOLS.map(tool => {
            const isActive = tool.slug === activePath
            return (
              <button
                key={tool.slug}
                className={`tmenu-item${isActive ? ' active' : ''}${!tool.available ? ' unavailable' : ''}`}
                onClick={() => handleTool(tool)}
                disabled={!tool.available}
                title={tool.available ? tool.label : 'Sắp ra mắt'}
              >
                <span className="tmenu-item-emoji">{tool.emoji}</span>
                <span className="tmenu-item-label">{tool.label}</span>
                {!tool.available && <span className="tmenu-item-soon">Sắp ra</span>}
              </button>
            )
          })}
        </div>
        <div className="tmenu-footer">
          <span>ChilàThu Tools · {TOOLS.filter(t => t.available).length}/{TOOLS.length} công cụ</span>
        </div>
      </div>
    </div>
  )
}
