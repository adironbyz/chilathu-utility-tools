import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home.jsx'
import TinhTienDien from './pages/TinhTienDien/TinhTienDien.jsx'
import TinhTienNuoc from './pages/TinhTienNuoc/TinhTienNuoc.jsx'
import TinhLuong from './pages/TinhLuong/TinhLuong.jsx'
import LaiTheTinDung from './pages/LaiTheTinDung/LaiTheTinDung.jsx'
import TinhLaiVay from './pages/TinhLaiVay/TinhLaiVay.jsx'
import TraGop from './pages/TraGop/TraGop.jsx'
import ChiaTien from './pages/ChiaTien/ChiaTien.jsx'
import DuLich from './pages/DuLich/DuLich.jsx'
import SoSanhLaiSuat from './pages/SoSanhLaiSuat/SoSanhLaiSuat.jsx'
import Admin from './pages/Admin/Admin.jsx'
import { loadAffiliateConfig } from './data/affiliates.js'

export default function App() {
  // Đợi load remote affiliate config (KV) trước khi render Routes — tránh
  // flash content with stale defaults. Nếu fetch fail → defaults bundled.
  // Idempotent: gọi nhiều lần OK.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Race với timeout 1500ms — nếu API chậm, fallback defaults và render luôn.
    // Sau đó config sẽ được override silently khi fetch xong (next page nav).
    const timeout = new Promise((r) => setTimeout(r, 1500))
    Promise.race([loadAffiliateConfig(), timeout]).finally(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) return null // blank flash <300ms ở common case

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tinh-tien-dien" element={<TinhTienDien />} />
        <Route path="/tinh-tien-nuoc" element={<TinhTienNuoc />} />
        <Route path="/tinh-luong" element={<TinhLuong />} />
        <Route path="/lai-the-tin-dung" element={<LaiTheTinDung />} />
        <Route path="/tinh-lai-vay" element={<TinhLaiVay />} />
        <Route path="/tra-gop" element={<TraGop />} />
        <Route path="/chia-tien" element={<ChiaTien />} />
        <Route path="/chi-phi-du-lich" element={<DuLich />} />
        <Route path="/so-sanh-lai-suat" element={<SoSanhLaiSuat />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
