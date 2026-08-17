import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './features/auth/Login'
import Help from './features/help/Help'
import MandorLayout from './layouts/MandorLayout'
import AdminLayout from './layouts/AdminLayout'
import InputProduksi from './features/mandor/InputProduksi'
import Riwayat from './features/mandor/Riwayat'
import Dashboard from './features/admin/Dashboard'
import DataProduksi from './features/admin/DataProduksi'
import Payroll from './features/admin/Payroll'
import Master from './features/admin/Master'
import Pengaturan from './features/settings/Pengaturan'
import { Spinner } from './components/ui'

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin' : '/mandor'} replace />
}

function Protected({ role, children }: { role: 'admin' | 'mandor'; children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/mandor'} replace />
  }
  return <>{children}</>
}

function ProtectedAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function HelpRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin/bantuan' : '/mandor/bantuan'} replace />
}

function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/help" element={<HelpRedirect />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/pengaturan"
        element={
          <ProtectedAuth>
            <Pengaturan />
          </ProtectedAuth>
        }
      />
      <Route
        path="/mandor"
        element={
          <Protected role="mandor">
            <MandorLayout />
          </Protected>
        }
      >
        <Route index element={<InputProduksi />} />
        <Route path="riwayat" element={<Riwayat />} />
        <Route path="bantuan" element={<Help />} />
      </Route>
      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AdminLayout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="produksi" element={<DataProduksi />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="master" element={<Master />} />
        <Route path="bantuan" element={<Help />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </AuthProvider>
  )
}
