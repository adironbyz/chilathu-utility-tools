import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, LinkSquare01Icon } from '@hugeicons/core-free-icons'
import { Logo } from '../../components/Logo.jsx'
import SEO from '../../components/SEO.jsx'
import './Home.css'

const UTM = '?utm_source=tienich.chilathu.com&utm_medium=hub&utm_campaign=tools_home'
const BILLS_URL = `https://app.chilathu.com${UTM}`

// ─── Categories ──────────────────────────────────────────────────────────────
// Order = filter chip order. Mirror Accesstrade structure nhưng end-user friendly.
const CATEGORIES = [
  { id: 'all',     label: 'Tất cả' },
  { id: 'finance', label: 'Tài chính' },
  { id: 'bills',   label: 'Hóa đơn' },
  { id: 'travel',  label: 'Du lịch' },
  // future: { id: 'business', label: 'Kinh doanh' }, { id: 'lifestyle', label: 'Xe & Sức khỏe' }
]

// Map category id → display label cho section header (khi xem "Tất cả")
const CATEGORY_LABELS = {
  finance:  'Tài chính cá nhân',
  bills:    'Hóa đơn & tiện ích',
  travel:   'Đi chơi & du lịch',
}

// ─── Tools ───────────────────────────────────────────────────────────────────
// `category` quyết định grouping. `popular` / `isNew` show badge inline.
// Thứ tự trong array = thứ tự hiển thị trong từng category.
const TOOLS = [
  // Tài chính
  {
    slug: 'tinh-luong',
    category: 'finance',
    popular: true,
    emoji: '💰',
    label: 'Tính lương Net',
    desc: 'Gross → Net, khấu trừ BHXH & thuế TNCN lũy tiến',
    color: '#dcfce7',
    colorBorder: '#86efac',
  },
  {
    slug: 'tinh-lai-vay',
    category: 'finance',
    popular: true,
    emoji: '🏦',
    label: 'Tính lãi vay ngân hàng',
    desc: 'Vay nhanh, mua nhà, mua xe, vay tiêu dùng',
    color: '#ede9fe',
    colorBorder: '#c4b5fd',
  },
  {
    slug: 'tra-gop',
    category: 'finance',
    emoji: '📅',
    label: 'Tính trả góp',
    desc: '0% không phí, 0% có phí chuyển đổi, có lãi suất',
    color: '#fce7f3',
    colorBorder: '#f9a8d4',
  },
  {
    slug: 'lai-the-tin-dung',
    category: 'finance',
    emoji: '💳',
    label: 'Lãi thẻ tín dụng quá hạn',
    desc: 'Tối thiểu, tự nhập, hoặc không trả',
    color: '#fef2f2',
    colorBorder: '#fca5a5',
  },

  // Hóa đơn & tiện ích
  {
    slug: 'tinh-tien-dien',
    category: 'bills',
    popular: true,
    emoji: '⚡',
    label: 'Tính tiền điện',
    desc: 'Bậc thang EVN, đủ 5 nhóm hộ dùng điện',
    color: '#fef9c3',
    colorBorder: '#fde047',
  },
  {
    slug: 'tinh-tien-nuoc',
    category: 'bills',
    emoji: '💧',
    label: 'Tính tiền nước',
    desc: 'Bậc thang nước sinh hoạt, đủ 63 tỉnh thành',
    color: '#e0f2fe',
    colorBorder: '#7dd3fc',
  },

  // Đi chơi & du lịch
  {
    slug: 'chia-tien',
    category: 'travel',
    emoji: '👥',
    label: 'Chia tiền nhóm',
    desc: 'Chia đều hoặc theo món — tính ai chuyển cho ai',
    color: '#ffedd5',
    colorBorder: '#fdba74',
  },
  {
    slug: 'chi-phi-du-lich',
    category: 'travel',
    emoji: '✈️',
    label: 'Chi phí du lịch',
    desc: 'Ngân sách theo hạng mục, đổi ngoại tệ, chia đầu người',
    color: '#fff7ed',
    colorBorder: '#fdba74',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ToolCard({ tool, onClick }) {
  return (
    <button
      className="home-tool-card available"
      onClick={onClick}
    >
      <div
        className="home-tool-emoji-wrap"
        style={{ background: tool.color, borderColor: tool.colorBorder }}
      >
        <span className="home-tool-emoji">{tool.emoji}</span>
      </div>

      <div className="home-tool-body">
        <div className="home-tool-name-row">
          <span className="home-tool-name">{tool.label}</span>
          {tool.popular && <span className="home-tool-badge popular">Phổ biến</span>}
          {tool.isNew && <span className="home-tool-badge new">Mới</span>}
        </div>
        <div className="home-tool-desc">{tool.desc}</div>
      </div>

      <div className="home-tool-right">
        <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="var(--m-green-dark)" strokeWidth={2} />
      </div>
    </button>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')

  // Group tools by category cho mode "Tất cả"
  const grouped = CATEGORIES
    .filter(c => c.id !== 'all')
    .map(c => ({
      ...c,
      tools: TOOLS.filter(t => t.category === c.id),
    }))
    .filter(g => g.tools.length > 0)

  // Flat filtered list khi user chọn 1 category cụ thể
  const filtered = TOOLS.filter(t => t.category === activeCategory)

  return (
    <div className="home-page">
      <SEO
        title="Tính tiền điện, nước, lương Net, lãi vay — miễn phí cho người Việt"
        description="Tính tiền điện, tiền nước, lương Net, lãi vay, trả góp, chia tiền nhóm, chi phí du lịch. 8 công cụ tài chính miễn phí. Không cần đăng nhập, kết quả tức thì."
        path="/"
        keywords="tính tiền điện, tính tiền nước, tính lương net, công cụ tài chính cá nhân, tính lãi vay, chia tiền nhóm"
      />

      <header className="home-header">
        <Logo size="lg" />
        <p className="home-tagline">Bộ công cụ tài chính cá nhân</p>
      </header>

      <main className="home-content">
        {/* ── Filter chips ── */}
        <nav className="home-filters" role="tablist" aria-label="Lọc theo nhóm">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`home-filter-chip${activeCategory === cat.id ? ' active' : ''}`}
              role="tab"
              aria-selected={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        {/* ── Tool grid ── */}
        {activeCategory === 'all' ? (
          // Grouped view với section headers
          grouped.map(group => (
            <section key={group.id} className="home-section">
              <h2 className="home-section-label">{CATEGORY_LABELS[group.id] || group.label}</h2>
              <div className="home-grid">
                {group.tools.map(tool => (
                  <ToolCard
                    key={tool.slug}
                    tool={tool}
                    onClick={() => navigate(`/${tool.slug}`)}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          // Flat filtered view
          <section className="home-section">
            <div className="home-grid">
              {filtered.map(tool => (
                <ToolCard
                  key={tool.slug}
                  tool={tool}
                  onClick={() => navigate(`/${tool.slug}`)}
                />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="home-empty">Chưa có công cụ trong nhóm này</div>
            )}
          </section>
        )}

        {/* ── Flagship app card — luôn hiện ở cuối, không phụ thuộc filter ── */}
        <section className="home-section">
          <div className="home-grid">
            <a
              className="home-tool-card home-app-card"
              href={BILLS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="home-app-icon"
                src="/apple-touch-icon.png"
                alt="ChilàThu app"
                width="44"
                height="44"
              />
              <div className="home-tool-body">
                <div className="home-tool-name-row">
                  <span className="home-tool-name">Công cụ chat tiền vào, tiền ra</span>
                  <span className="home-tool-badge app">Ứng dụng</span>
                </div>
                <div className="home-tool-desc">Ghi chép chi tiêu hàng ngày bằng 1 dòng tin nhắn</div>
              </div>
              <div className="home-tool-right">
                <HugeiconsIcon icon={LinkSquare01Icon} size={18} color="var(--m-green-dark)" strokeWidth={1.5} />
              </div>
            </a>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <span>© ChilàThu · tienich.chilathu.com</span>
      </footer>
    </div>
  )
}
