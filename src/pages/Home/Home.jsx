import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, LinkSquare01Icon } from '@hugeicons/core-free-icons'
import { Logo } from '../../components/Logo.jsx'
import './Home.css'

const UTM = '?utm_source=tools.chilathu.com&utm_medium=hub&utm_campaign=tools_home'
const BILLS_URL = `https://app.chilathu.com${UTM}`

const TOOLS = [
  {
    slug: 'tinh-tien-dien',
    emoji: '⚡',
    label: 'Tính tiền điện',
    desc: 'Bậc thang EVN, đủ 5 nhóm hộ dùng điện',
    available: true,
    color: '#fef9c3',
    colorBorder: '#fde047',
  },
  {
    slug: 'tinh-tien-nuoc',
    emoji: '💧',
    label: 'Tính tiền nước',
    desc: 'Bậc thang nước sinh hoạt theo vùng',
    available: false,
    color: '#e0f2fe',
    colorBorder: '#7dd3fc',
  },
  {
    slug: 'tinh-luong',
    emoji: '💰',
    label: 'Tính lương Net',
    desc: 'Gross → Net, khấu trừ BHXH & thuế TNCN',
    available: false,
    color: '#dcfce7',
    colorBorder: '#86efac',
  },
  {
    slug: 'tinh-lai-vay',
    emoji: '🏦',
    label: 'Tính lãi vay',
    desc: 'Lãi đơn, lãi kép, dư nợ giảm dần',
    available: false,
    color: '#ede9fe',
    colorBorder: '#c4b5fd',
  },
  {
    slug: 'tra-gop',
    emoji: '📅',
    label: 'Trả góp',
    desc: 'Trả góp 0%, ngân hàng, tài chính tiêu dùng',
    available: false,
    color: '#fce7f3',
    colorBorder: '#f9a8d4',
  },
  {
    slug: 'chia-tien',
    emoji: '👥',
    label: 'Chia tiền nhóm',
    desc: 'Chia đều chi phí, ai trả ai nhận',
    available: false,
    color: '#ffedd5',
    colorBorder: '#fdba74',
  },
  {
    slug: 'chia-bill',
    emoji: '🍜',
    label: 'Chia bill',
    desc: 'Hóa đơn ăn uống, mỗi người ăn gì trả nấy',
    available: false,
    color: '#fef2f2',
    colorBorder: '#fca5a5',
  },
  {
    slug: 'lai-the-tin-dung',
    emoji: '💳',
    label: 'Lãi thẻ tín dụng',
    desc: 'Lãi phát sinh khi không trả đủ tối thiểu',
    available: false,
    color: '#f0fdf4',
    colorBorder: '#86efac',
  },
  {
    slug: 'mua-duoc-khong',
    emoji: '🏠',
    label: 'Mua được không?',
    desc: 'Thu nhập có đủ vay mua nhà, xe không',
    available: false,
    color: '#ecfdf5',
    colorBorder: '#6ee7b7',
  },
  {
    slug: 'tiet-kiem',
    emoji: '🎯',
    label: 'Mục tiêu tiết kiệm',
    desc: 'Bao lâu đạt đủ số tiền muốn để dành',
    available: false,
    color: '#f0f9ff',
    colorBorder: '#7dd3fc',
  },
  {
    slug: 'chi-phi-du-lich',
    emoji: '✈️',
    label: 'Chi phí du lịch',
    desc: 'Lên ngân sách chuyến đi, đổi ngoại tệ',
    available: false,
    color: '#fff7ed',
    colorBorder: '#fdba74',
  },
  {
    slug: 'quy-khan-cap',
    emoji: '🛡️',
    label: 'Quỹ khẩn cấp',
    desc: 'Cần để dành bao nhiêu cho 3–6 tháng',
    available: false,
    color: '#f5f3ff',
    colorBorder: '#c4b5fd',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      <header className="home-header">
        <Logo size="lg" />
        <p className="home-tagline">Bộ công cụ tài chính cá nhân</p>
      </header>

      <main className="home-content">

        {/* ── Flagship app entry ── */}
        <a
          className="home-bills-card"
          href={BILLS_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="home-bills-left">
            <Logo size="sm" />
            <div className="home-bills-badge">Ứng dụng</div>
          </div>
          <div className="home-bills-body">
            <div className="home-bills-name">Sổ thu chi</div>
            <div className="home-bills-desc">Ghi chép chi tiêu hàng ngày bằng 1 dòng tin nhắn</div>
          </div>
          <HugeiconsIcon icon={LinkSquare01Icon} size={18} color="var(--m-green-dark)" strokeWidth={1.5} />
        </a>

        <div className="home-section-label">Công cụ tính nhanh</div>

        <div className="home-grid">
          {TOOLS.map(tool => (
            <button
              key={tool.slug}
              className={`home-tool-card${tool.available ? ' available' : ' coming'}`}
              onClick={() => tool.available && navigate(`/${tool.slug}`)}
              disabled={!tool.available}
            >
              <div
                className="home-tool-emoji-wrap"
                style={{ background: tool.color, borderColor: tool.colorBorder }}
              >
                <span className="home-tool-emoji">{tool.emoji}</span>
              </div>

              <div className="home-tool-body">
                <div className="home-tool-name">{tool.label}</div>
                <div className="home-tool-desc">{tool.desc}</div>
              </div>

              <div className="home-tool-right">
                {tool.available
                  ? <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="var(--m-green-dark)" strokeWidth={2} />
                  : <span className="home-tool-soon">Sắp ra</span>
                }
              </div>
            </button>
          ))}
        </div>  {/* end home-grid */}
      </main>

      <footer className="home-footer">
        <span>© ChilàThu · tools.chilathu.com</span>
      </footer>
    </div>
  )
}
