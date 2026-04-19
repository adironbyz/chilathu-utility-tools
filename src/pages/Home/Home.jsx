import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, LinkSquare01Icon } from '@hugeicons/core-free-icons'
import { Logo } from '../../components/Logo.jsx'
import SEO from '../../components/SEO.jsx'
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
    desc: 'Bậc thang nước sinh hoạt, đủ 63 tỉnh thành',
    available: true,
    color: '#e0f2fe',
    colorBorder: '#7dd3fc',
  },
  {
    slug: 'tinh-luong',
    emoji: '💰',
    label: 'Tính lương Net',
    desc: 'Gross → Net, khấu trừ BHXH & thuế TNCN lũy tiến',
    available: true,
    color: '#dcfce7',
    colorBorder: '#86efac',
  },
  {
    slug: 'lai-the-tin-dung',
    emoji: '💳',
    label: 'Tính lãi thẻ tín dụng quá hạn',
    desc: 'Tính lãi khi không trả đủ — tối thiểu, tự nhập, hoặc không trả',
    available: true,
    color: '#fef2f2',
    colorBorder: '#fca5a5',
  },
  {
    slug: 'tinh-lai-vay',
    emoji: '🏦',
    label: 'Tính lãi vay ngân hàng, Cty tài chính',
    desc: 'Vay nhanh, mua nhà, mua xe, vay tiêu dùng',
    available: true,
    color: '#ede9fe',
    colorBorder: '#c4b5fd',
  },
  {
    slug: 'tra-gop',
    emoji: '📅',
    label: 'Tính trả góp',
    desc: '0% không phí, 0% có phí chuyển đổi, có lãi suất',
    available: true,
    color: '#fce7f3',
    colorBorder: '#f9a8d4',
  },
  {
    slug: 'chia-tien',
    emoji: '👥',
    label: 'Chia tiền nhóm',
    desc: 'Chia đều hoặc theo món — tính ai chuyển cho ai',
    available: true,
    color: '#ffedd5',
    colorBorder: '#fdba74',
  },
  {
    slug: 'chi-phi-du-lich',
    emoji: '✈️',
    label: 'Chi phí du lịch',
    desc: 'Ngân sách theo hạng mục, đổi ngoại tệ, chia theo đầu người',
    available: true,
    color: '#fff7ed',
    colorBorder: '#fdba74',
  },
]

export default function Home() {
  const navigate = useNavigate()

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
