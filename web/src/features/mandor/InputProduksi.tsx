import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPekerjaAktif,
  getPoAktif,
  getTipeSepatuAktif,
  getUkuranAktif,
  simpanProduksi,
} from '../../lib/api'
import type { MasterPo, MasterUkuran, Pekerja, TipeSepatu } from '../../lib/types'
import { SHIFTS, formatRupiah, tanggalHariIni } from '../../lib/constants'
import { BigButton, Card, ErrorBox, Spinner } from '../../components/ui'

type Step = 'pekerja' | 'shift' | 'model' | 'po' | 'qty' | 'ringkas'

export default function InputProduksi() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('pekerja')
  const [pekerjaList, setPekerjaList] = useState<Pekerja[]>([])
  const [modelList, setModelList] = useState<TipeSepatu[]>([])
  const [ukuranList, setUkuranList] = useState<MasterUkuran[]>([])
  const [poList, setPoList] = useState<MasterPo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sukses, setSukses] = useState(false)

  const [idPekerja, setIdPekerja] = useState<number | null>(null)
  const [shift, setShift] = useState<1 | 2>(1)
  const [idSepatu, setIdSepatu] = useState<number | null>(null)
  const [idPo, setIdPo] = useState<number | null>(null)
  const [qty, setQty] = useState<Record<string, number>>({})

  useEffect(() => {
    Promise.all([getPekerjaAktif(), getTipeSepatuAktif(), getUkuranAktif(), getPoAktif()])
      .then(([p, m, u, po]) => {
        setPekerjaList(p)
        setModelList(m)
        setUkuranList(u)
        setPoList(po)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function reset() {
    setIdPekerja(null)
    setShift(1)
    setIdSepatu(null)
    setIdPo(null)
    setQty({})
    setStep('pekerja')
    setSukses(false)
  }

  const totalPasang = ukuranList.reduce((acc, u) => acc + (qty[String(u.id_ukuran)] ?? 0), 0)

  async function onSimpan() {
    setSaving(true)
    setError(null)
    try {
      await simpanProduksi({
        tanggal: tanggalHariIni(),
        shift,
        id_pekerja: idPekerja ?? 0,
        id_sepatu: idSepatu ?? 0,
        id_po: idPo,
        qtyPerUkuran: ukuranList.map((u) => ({
          id_ukuran: String(u.id_ukuran),
          qty: qty[String(u.id_ukuran)] ?? 0,
        })),
      })
      setSukses(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  if (error && ukuranList.length === 0) return <ErrorBox message={error} />

  const pekerja = pekerjaList.find((p) => p.id_pekerja === idPekerja)
  const model = modelList.find((m) => m.id_sepatu === idSepatu)
  const po = poList.find((p) => p.id_po === idPo)

  const stepTitles: Record<Step, string> = {
    pekerja: 'Pilih Pekerja',
    shift: 'Pilih Shift',
    model: 'Pilih Model Sepatu',
    po: 'PO (Opsional)',
    qty: 'Isi Jumlah per Ukuran',
    ringkas: 'Cek & Simpan',
  }

  if (sukses) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl">✅</div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Data Tersimpan!</h2>
        <p className="mt-1 text-sm text-slate-500">
          {pekerja?.nama} · {model?.nama_model} · {shift === 1 ? 'Shift 1' : 'Shift 2'} ·{' '}
          {totalPasang} pasang
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
          <BigButton onClick={reset} className="w-full">
            Input Lagi
          </BigButton>
          <BigButton variant="ghost" onClick={() => navigate('/mandor/riwayat')}>
            Lihat Riwayat Hari Ini
          </BigButton>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">{stepTitles[step]}</h1>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
          <span>Langkah</span>
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-white">
            {['pekerja', 'shift', 'model', 'po', 'qty', 'ringkas'].indexOf(step) + 1}/6
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-3">
          <ErrorBox message={error} />
        </div>
      )}

      {/* STEP 1: PEKERJA */}
      {step === 'pekerja' && (
        <div className="space-y-3">
          {pekerjaList.map((p) => (
            <button
              key={p.id_pekerja}
              onClick={() => {
                setIdPekerja(p.id_pekerja)
                setStep('shift')
              }}
              className="w-full rounded-2xl border-2 border-transparent bg-white p-4 text-left text-base font-semibold text-slate-800 shadow-sm transition-colors active:border-emerald-500 active:bg-emerald-50"
            >
              👤 {p.nama}
            </button>
          ))}
          {pekerjaList.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada pekerja aktif.</p>
          )}
        </div>
      )}

      {/* STEP 2: SHIFT */}
      {step === 'shift' && (
        <div className="space-y-3">
          {SHIFTS.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setShift(s.value)
                setStep('model')
              }}
              className="w-full rounded-2xl border-2 border-transparent bg-white p-5 text-center shadow-sm transition-colors active:border-emerald-500 active:bg-emerald-50"
            >
              <div className="text-xl font-bold text-slate-900">{s.label}</div>
              <div className="text-sm text-slate-500">{s.sub}</div>
            </button>
          ))}
          <BigButton variant="ghost" className="w-full" onClick={() => setStep('pekerja')}>
            ← Kembali
          </BigButton>
        </div>
      )}

      {/* STEP 3: MODEL */}
      {step === 'model' && (
        <div className="space-y-3">
          {modelList.map((m) => (
            <button
              key={m.id_sepatu}
              onClick={() => {
                setIdSepatu(m.id_sepatu)
                setStep('po')
              }}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-transparent bg-white p-4 shadow-sm transition-colors active:border-emerald-500 active:bg-emerald-50"
            >
              <span className="text-base font-semibold text-slate-800">👟 {m.nama_model}</span>
              <span className="text-sm text-slate-500">{formatRupiah(m.ongkos_kerja)}/pasang</span>
            </button>
          ))}
          {modelList.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada model sepatu aktif.</p>
          )}
          <BigButton variant="ghost" className="w-full" onClick={() => setStep('shift')}>
            ← Kembali
          </BigButton>
        </div>
      )}

      {/* STEP 4: PO (OPSIONAL) */}
      {step === 'po' && (
        <div className="space-y-3">
          <button
            onClick={() => setStep('qty')}
            className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-base font-semibold text-slate-500"
          >
            Lewati (tanpa PO)
          </button>
          {poList.map((p) => (
            <button
              key={p.id_po}
              onClick={() => {
                setIdPo(p.id_po)
                setStep('qty')
              }}
              className="w-full rounded-2xl border-2 border-transparent bg-white p-4 text-left shadow-sm transition-colors active:border-emerald-500 active:bg-emerald-50"
            >
              <div className="font-semibold text-slate-800">📦 {p.no_po}</div>
              {p.nama_customer && (
                <div className="text-sm text-slate-500">Customer: {p.nama_customer}</div>
              )}
            </button>
          ))}
          {poList.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada PO. Pilih "Lewati".</p>
          )}
          <BigButton variant="ghost" className="w-full" onClick={() => setStep('model')}>
            ← Kembali
          </BigButton>
        </div>
      )}

      {/* STEP 5: QTY PER UKURAN */}
      {step === 'qty' && (
        <div className="space-y-3">
          {ukuranList.map((u) => (
            <div
              key={u.id_ukuran}
              className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm"
            >
              <span className="text-lg font-bold text-slate-800">{u.label_ukuran}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                value={qty[String(u.id_ukuran)] ?? ''}
                onChange={(e) =>
                  setQty((prev) => ({
                    ...prev,
                    [String(u.id_ukuran)]: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                  }))
                }
                className="w-24 rounded-xl border border-slate-300 px-4 py-3 text-center text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ))}
          {ukuranList.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada ukuran aktif. Atur di Master Data.</p>
          )}

          <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
            <span className="font-semibold">Total Pasang</span>
            <span className="text-xl font-bold">{totalPasang}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <BigButton variant="ghost" onClick={() => setStep('po')}>
              ← Kembali
            </BigButton>
            <BigButton
              disabled={totalPasang <= 0}
              onClick={() => setStep('ringkas')}
            >
              Lanjut →
            </BigButton>
          </div>
        </div>
      )}

      {/* STEP 6: RINGKASAN */}
      {step === 'ringkas' && (
        <Card>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Pekerja</dt>
              <dd className="font-semibold text-slate-900">{pekerja?.nama}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Shift</dt>
              <dd className="font-semibold text-slate-900">
                {shift === 1 ? 'Shift 1 (Pagi)' : 'Shift 2 (Siang/Malam)'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Model</dt>
              <dd className="font-semibold text-slate-900">{model?.nama_model}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Ongkos</dt>
              <dd className="font-semibold text-slate-900">
                {model ? formatRupiah(model.ongkos_kerja) : '-'}/pasang
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">PO</dt>
              <dd className="font-semibold text-slate-900">{po?.no_po ?? '—'}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <dt className="text-slate-500">Total Pasang</dt>
              <dd className="text-lg font-bold text-emerald-700">{totalPasang}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Perkiraan Gaji</dt>
              <dd className="text-lg font-bold text-emerald-700">
                {model ? formatRupiah(totalPasang * model.ongkos_kerja) : '-'}
              </dd>
            </div>
          </dl>

          {error && (
            <div className="mt-3">
              <ErrorBox message={error} />
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <BigButton variant="ghost" onClick={() => setStep('qty')}>
              ← Edit
            </BigButton>
            <BigButton onClick={onSimpan} disabled={saving}>
              {saving ? 'Menyimpan...' : 'SIMPAN'}
            </BigButton>
          </div>
        </Card>
      )}
    </div>
  )
}
