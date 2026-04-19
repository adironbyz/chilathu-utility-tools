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

export default function App() {
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
      </Routes>
    </BrowserRouter>
  )
}
