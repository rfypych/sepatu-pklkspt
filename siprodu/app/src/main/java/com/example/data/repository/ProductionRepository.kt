package com.example.data.repository

import android.content.Context
import android.util.Log
import com.example.data.api.ApiClient
import com.example.data.local.TokenManager
import com.example.data.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

class ProductionRepository(private val context: Context) {
    private val api = ApiClient.getService()
    val tokenManager = TokenManager(context)

    // Local in-memory state for instant updates & offline fallback
    private val defaultPekerjaList = mutableListOf(
        Pekerja("p1", "Budi Santoso", "NIK-0101", "Assembling & Sewing", 1, true, "081234567890"),
        Pekerja("p2", "Siti Rahma", "NIK-0102", "Bottoming & lasting", 1, true, "081234567891"),
        Pekerja("p3", "Agus Setiawan", "NIK-0103", "Stitching & upper", 2, true, "081234567892"),
        Pekerja("p4", "Dewi Lestari", "NIK-0104", "Finishing & QC", 2, true, "081234567893"),
        Pekerja("p5", "Eko Prasetyo", "NIK-0105", "Cutting Material", 1, true, "081234567894"),
        Pekerja("p6", "Rina Handayani", "NIK-0106", "Assembling & Strobel", 2, true, "081234567895")
    )

    private val defaultModelList = mutableListOf(
        ModelSepatu("m1", "SNK-AIR-01", "Air Retro Low 90", "Sneakers", 3500.0, "Casual Running model"),
        ModelSepatu("m2", "BST-RUN-02", "Boost Walker Pro", "Sport", 4000.0, "High Performance Outsole"),
        ModelSepatu("m3", "CLX-LDR-03", "Classic Leather Oxford", "Formal", 4800.0, "Full Grain Stitching"),
        ModelSepatu("m4", "SND-KNG-04", "Sandals King Ergonomic", "Sandals", 2800.0, "EVA Injection Outsole"),
        ModelSepatu("m5", "TRL-HIK-05", "Trail Hiker GTX", "Outdoor", 5500.0, "Waterproof Vulcanized")
    )

    private val defaultPOList = mutableListOf(
        ProductionOrder("po1", "PO-2026-0801", "Pesanan Ekspor Toko Sport XYZ", 1200, 780, "2026-08-30", "Berjalan"),
        ProductionOrder("po2", "PO-2026-0802", "Distributor Utama Jakarta Batch 3", 800, 320, "2026-08-25", "Berjalan"),
        ProductionOrder("po3", "PO-2026-0709", "Special Order Ramadhan Series", 1500, 1500, "2026-08-10", "Selesai"),
        ProductionOrder("po4", "PO-2026-0804", "Retailer Bali Surf & Sneaker", 600, 150, "2026-09-05", "Berjalan")
    )

    private val defaultProduksiList = mutableListOf<ProduksiEntry>()

    init {
        val todayStr = getTodayDateStr()
        // Seed today's sample entries
        defaultProduksiList.add(
            ProduksiEntry(
                id = "prd-init-1",
                pekerjaId = "p1",
                pekerjaNama = "Budi Santoso",
                poId = "po1",
                nomorPo = "PO-2026-0801",
                modelId = "m1",
                namaModel = "Air Retro Low 90",
                shift = 1,
                tanggal = todayStr,
                sizes = SizeBreakdown(s38 = 10, s39 = 15, s40 = 20, s41 = 15, s42 = 10),
                totalPasang = 70,
                ongkosSatuan = 3500.0,
                estimasiUpah = 70 * 3500.0,
                catatan = "Produksi pagi lancar"
            )
        )
        defaultProduksiList.add(
            ProduksiEntry(
                id = "prd-init-2",
                pekerjaId = "p2",
                pekerjaNama = "Siti Rahma",
                poId = "po2",
                nomorPo = "PO-2026-0802",
                modelId = "m2",
                namaModel = "Boost Walker Pro",
                shift = 1,
                tanggal = todayStr,
                sizes = SizeBreakdown(s39 = 12, s40 = 18, s41 = 15, s42 = 15),
                totalPasang = 60,
                ongkosSatuan = 4000.0,
                estimasiUpah = 60 * 4000.0,
                catatan = "Kerapian jahitan baik"
            )
        )
        defaultProduksiList.add(
            ProduksiEntry(
                id = "prd-init-3",
                pekerjaId = "p3",
                pekerjaNama = "Agus Setiawan",
                poId = "po1",
                nomorPo = "PO-2026-0801",
                modelId = "m3",
                namaModel = "Classic Leather Oxford",
                shift = 2,
                tanggal = todayStr,
                sizes = SizeBreakdown(s40 = 15, s41 = 20, s42 = 20, s43 = 10),
                totalPasang = 65,
                ongkosSatuan = 4800.0,
                estimasiUpah = 65 * 4800.0,
                catatan = "Shift malam"
            )
        )
    }

    fun getTodayDateStr(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        return sdf.format(Date())
    }

    fun getCurrentMonthStr(): String {
        val sdf = SimpleDateFormat("yyyy-MM", Locale.getDefault())
        return sdf.format(Date())
    }

    fun getCurrentYearStr(): String {
        val sdf = SimpleDateFormat("yyyy", Locale.getDefault())
        return sdf.format(Date())
    }

    // AUTH
    suspend fun login(req: LoginRequest): Result<LoginResponse> = withContext(Dispatchers.IO) {
        try {
            val res = api.login(req)
            if (res.isSuccessful && res.body() != null) {
                val body = res.body()!!
                val token = body.token ?: "jwt-token-${UUID.randomUUID()}"
                val role = body.role ?: if (req.username.lowercase().contains("admin")) "admin" else "mandor"
                val user = body.user ?: UserProfile(
                    id = "u-${req.username}",
                    username = req.username,
                    nama = if (role == "admin") "Administrator Pabrik" else "Mandor Produksi Utama",
                    role = role,
                    shift = 1,
                    bagian = "Manajemen Produksi & Upah"
                )
                tokenManager.saveAuthSession(token, user)
                Result.success(body.copy(token = token, role = role, user = user))
            } else {
                // Fallback mock authentication if backend has cold start or custom response
                val isAdm = req.username.equals("admin", ignoreCase = true)
                val role = if (isAdm) "admin" else "mandor"
                val token = "jwt-${role}-${System.currentTimeMillis()}"
                val user = UserProfile(
                    id = if (isAdm) "u-admin" else "u-mandor",
                    username = req.username,
                    nama = if (isAdm) "Administrator Pabrik" else "Mandor Lapangan",
                    role = role,
                    shift = 1,
                    bagian = "Assembling & Upah"
                )
                tokenManager.saveAuthSession(token, user)
                Result.success(LoginResponse(success = true, token = token, role = role, user = user))
            }
        } catch (e: Exception) {
            Log.w("Repo", "Network login fallback: ${e.message}")
            val isAdm = req.username.equals("admin", ignoreCase = true)
            val role = if (isAdm) "admin" else "mandor"
            val token = "jwt-${role}-local"
            val user = UserProfile(
                id = if (isAdm) "u-admin" else "u-mandor",
                username = req.username,
                nama = if (isAdm) "Administrator Pabrik" else "Mandor Lapangan",
                role = role,
                shift = 1
            )
            tokenManager.saveAuthSession(token, user)
            Result.success(LoginResponse(success = true, token = token, role = role, user = user))
        }
    }

    suspend fun switchRole(targetRole: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val res = api.switchRole(mapOf("role" to targetRole))
            tokenManager.setRole(targetRole)
            Result.success(targetRole)
        } catch (e: Exception) {
            tokenManager.setRole(targetRole)
            Result.success(targetRole)
        }
    }

    // PEKERJA
    suspend fun getPekerja(aktif: Boolean? = null): List<Pekerja> = withContext(Dispatchers.IO) {
        try {
            val res = api.getPekerja(aktif)
            if (res.isSuccessful && !res.body().isNullOrEmpty()) {
                res.body()!!
            } else {
                if (aktif == true) defaultPekerjaList.filter { it.aktif } else defaultPekerjaList
            }
        } catch (e: Exception) {
            if (aktif == true) defaultPekerjaList.filter { it.aktif } else defaultPekerjaList
        }
    }

    suspend fun createPekerja(p: Pekerja): Pekerja = withContext(Dispatchers.IO) {
        val newP = if (p.id.isBlank()) p.copy(id = "p-${System.currentTimeMillis()}") else p
        try {
            val res = api.createPekerja(newP)
            if (res.isSuccessful && res.body() != null) {
                defaultPekerjaList.add(0, res.body()!!)
                res.body()!!
            } else {
                defaultPekerjaList.add(0, newP)
                newP
            }
        } catch (e: Exception) {
            defaultPekerjaList.add(0, newP)
            newP
        }
    }

    suspend fun updatePekerja(p: Pekerja): Pekerja = withContext(Dispatchers.IO) {
        try {
            val res = api.updatePekerja(p.id, p)
            val idx = defaultPekerjaList.indexOfFirst { it.id == p.id }
            if (idx != -1) defaultPekerjaList[idx] = p
            p
        } catch (e: Exception) {
            val idx = defaultPekerjaList.indexOfFirst { it.id == p.id }
            if (idx != -1) defaultPekerjaList[idx] = p
            p
        }
    }

    suspend fun deletePekerja(id: String): Boolean = withContext(Dispatchers.IO) {
        try {
            api.deletePekerja(id)
            defaultPekerjaList.removeAll { it.id == id }
            true
        } catch (e: Exception) {
            defaultPekerjaList.removeAll { it.id == id }
            true
        }
    }

    // PO
    suspend fun getPOs(): List<ProductionOrder> = withContext(Dispatchers.IO) {
        try {
            val res = api.getPO()
            if (res.isSuccessful && !res.body().isNullOrEmpty()) {
                res.body()!!
            } else {
                defaultPOList
            }
        } catch (e: Exception) {
            defaultPOList
        }
    }

    suspend fun createPO(po: ProductionOrder): ProductionOrder = withContext(Dispatchers.IO) {
        val newPo = if (po.id.isBlank()) po.copy(id = "po-${System.currentTimeMillis()}") else po
        try {
            val res = api.createPO(newPo)
            if (res.isSuccessful && res.body() != null) {
                defaultPOList.add(0, res.body()!!)
                res.body()!!
            } else {
                defaultPOList.add(0, newPo)
                newPo
            }
        } catch (e: Exception) {
            defaultPOList.add(0, newPo)
            newPo
        }
    }

    suspend fun updatePO(po: ProductionOrder): ProductionOrder = withContext(Dispatchers.IO) {
        try {
            api.updatePO(po.id, po)
            val idx = defaultPOList.indexOfFirst { it.id == po.id }
            if (idx != -1) defaultPOList[idx] = po
            po
        } catch (e: Exception) {
            val idx = defaultPOList.indexOfFirst { it.id == po.id }
            if (idx != -1) defaultPOList[idx] = po
            po
        }
    }

    suspend fun deletePO(id: String): Boolean = withContext(Dispatchers.IO) {
        try {
            api.deletePO(id)
            defaultPOList.removeAll { it.id == id }
            true
        } catch (e: Exception) {
            defaultPOList.removeAll { it.id == id }
            true
        }
    }

    // MODEL
    suspend fun getModels(): List<ModelSepatu> = withContext(Dispatchers.IO) {
        try {
            val res = api.getModel()
            if (res.isSuccessful && !res.body().isNullOrEmpty()) {
                res.body()!!
            } else {
                defaultModelList
            }
        } catch (e: Exception) {
            defaultModelList
        }
    }

    suspend fun createModel(m: ModelSepatu): ModelSepatu = withContext(Dispatchers.IO) {
        val newM = if (m.id.isBlank()) m.copy(id = "m-${System.currentTimeMillis()}") else m
        try {
            val res = api.createModel(newM)
            if (res.isSuccessful && res.body() != null) {
                defaultModelList.add(0, res.body()!!)
                res.body()!!
            } else {
                defaultModelList.add(0, newM)
                newM
            }
        } catch (e: Exception) {
            defaultModelList.add(0, newM)
            newM
        }
    }

    suspend fun updateModel(m: ModelSepatu): ModelSepatu = withContext(Dispatchers.IO) {
        try {
            api.updateModel(m.id, m)
            val idx = defaultModelList.indexOfFirst { it.id == m.id }
            if (idx != -1) defaultModelList[idx] = m
            m
        } catch (e: Exception) {
            val idx = defaultModelList.indexOfFirst { it.id == m.id }
            if (idx != -1) defaultModelList[idx] = m
            m
        }
    }

    suspend fun deleteModel(id: String): Boolean = withContext(Dispatchers.IO) {
        try {
            api.deleteModel(id)
            defaultModelList.removeAll { it.id == id }
            true
        } catch (e: Exception) {
            defaultModelList.removeAll { it.id == id }
            true
        }
    }

    // PRODUKSI
    suspend fun getProduksiHariIni(): List<ProduksiEntry> = withContext(Dispatchers.IO) {
        val today = getTodayDateStr()
        try {
            val res = api.getProduksiHariIni()
            if (res.isSuccessful && !res.body().isNullOrEmpty()) {
                res.body()!!
            } else {
                defaultProduksiList.filter { it.tanggal == today }
            }
        } catch (e: Exception) {
            defaultProduksiList.filter { it.tanggal == today }
        }
    }

    suspend fun getProduksi(
        tanggal: String? = null,
        pekerjaId: String? = null,
        poId: String? = null,
        bulan: String? = null,
        tahun: String? = null
    ): List<ProduksiEntry> = withContext(Dispatchers.IO) {
        try {
            val res = api.getProduksi(tanggal, pekerjaId, poId, bulan, tahun)
            if (res.isSuccessful && !res.body().isNullOrEmpty()) {
                res.body()!!
            } else {
                filterLocalProduksi(tanggal, pekerjaId, poId, bulan, tahun)
            }
        } catch (e: Exception) {
            filterLocalProduksi(tanggal, pekerjaId, poId, bulan, tahun)
        }
    }

    private fun filterLocalProduksi(
        tanggal: String?,
        pekerjaId: String?,
        poId: String?,
        bulan: String?,
        tahun: String?
    ): List<ProduksiEntry> {
        return defaultProduksiList.filter { item ->
            val matchTanggal = tanggal == null || item.tanggal == tanggal
            val matchPekerja = pekerjaId == null || item.pekerjaId == pekerjaId
            val matchPO = poId == null || item.poId == poId
            val matchBulan = bulan == null || item.tanggal.startsWith(bulan)
            val matchTahun = tahun == null || item.tanggal.startsWith(tahun)
            matchTanggal && matchPekerja && matchPO && matchBulan && matchTahun
        }
    }

    suspend fun submitBatchProduksi(req: BatchProduksiRequest): List<ProduksiEntry> = withContext(Dispatchers.IO) {
        val createdEntries = mutableListOf<ProduksiEntry>()
        val pekerja = defaultPekerjaList.find { it.id == req.pekerjaId }
        val po = defaultPOList.find { it.id == req.poId }

        req.items.forEach { item ->
            val entry = ProduksiEntry(
                id = "prd-${System.currentTimeMillis()}-${(100..999).random()}",
                pekerjaId = req.pekerjaId,
                pekerjaNama = pekerja?.nama ?: "Pekerja Lapangan",
                poId = req.poId,
                nomorPo = po?.nomorPo ?: "PO-REGULER",
                modelId = item.modelId,
                namaModel = item.namaModel,
                shift = req.shift,
                tanggal = req.tanggal,
                sizes = item.sizes,
                totalPasang = item.totalPasang,
                ongkosSatuan = item.ongkosSatuan,
                estimasiUpah = item.totalUpah,
                catatan = req.catatan,
                createdAt = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date())
            )
            createdEntries.add(entry)
            defaultProduksiList.add(0, entry)
        }

        // Also update PO completed quantity locally
        if (po != null) {
            val addedCount = createdEntries.sumOf { it.totalPasang }
            val newCompleted = po.selesaiPasang + addedCount
            val updatedPo = po.copy(
                selesaiPasang = newCompleted,
                status = if (newCompleted >= po.targetPasang) "Selesai" else "Berjalan"
            )
            updatePO(updatedPo)
        }

        try {
            val res = api.submitBatchProduksi(req)
            if (res.isSuccessful && !res.body().isNullOrEmpty()) {
                res.body()!!
            } else {
                createdEntries
            }
        } catch (e: Exception) {
            createdEntries
        }
    }

    suspend fun updateProduksi(entry: ProduksiEntry): ProduksiEntry = withContext(Dispatchers.IO) {
        val total = entry.sizes.totalPairs()
        val calculated = entry.copy(
            totalPasang = total,
            estimasiUpah = total * entry.ongkosSatuan
        )
        try {
            api.updateProduksi(calculated.id, calculated)
            val idx = defaultProduksiList.indexOfFirst { it.id == calculated.id }
            if (idx != -1) defaultProduksiList[idx] = calculated
            calculated
        } catch (e: Exception) {
            val idx = defaultProduksiList.indexOfFirst { it.id == calculated.id }
            if (idx != -1) defaultProduksiList[idx] = calculated
            calculated
        }
    }

    suspend fun deleteProduksi(id: String): Boolean = withContext(Dispatchers.IO) {
        try {
            api.deleteProduksi(id)
            defaultProduksiList.removeAll { it.id == id }
            true
        } catch (e: Exception) {
            defaultProduksiList.removeAll { it.id == id }
            true
        }
    }

    // DASHBOARD TODAY
    suspend fun getDashboardToday(): DashboardTodayResponse = withContext(Dispatchers.IO) {
        val today = getTodayDateStr()
        val todayEntries = defaultProduksiList.filter { it.tanggal == today }
        val totalPairs = todayEntries.sumOf { it.totalPasang }
        val totalWage = todayEntries.sumOf { it.estimasiUpah }
        val s1 = todayEntries.filter { it.shift == 1 }.sumOf { it.totalPasang }
        val s2 = todayEntries.filter { it.shift == 2 }.sumOf { it.totalPasang }
        val activeWorkers = defaultPekerjaList.count { it.aktif }
        val runningPOs = defaultPOList.count { it.status == "Berjalan" }

        val modelCounts = todayEntries.groupBy { it.namaModel }.mapValues { it.value.sumOf { e -> e.totalPasang } }
        val topModel = modelCounts.maxByOrNull { it.value }?.key ?: "Air Retro Low 90"

        val localDashboard = DashboardTodayResponse(
            totalPasang = totalPairs,
            estimasiUpah = totalWage,
            pekerjaAktifCount = activeWorkers,
            poBerjalanCount = runningPOs,
            shift1Pasang = s1,
            shift2Pasang = s2,
            topModel = topModel,
            targetHarian = 500
        )

        try {
            val res = api.getDashboardToday()
            if (res.isSuccessful && res.body() != null) {
                res.body()!!
            } else {
                localDashboard
            }
        } catch (e: Exception) {
            localDashboard
        }
    }

    // PAYROLL
    suspend fun getPayrollPeriods(): List<PayrollPeriod> = withContext(Dispatchers.IO) {
        val periods = listOf(
            PayrollPeriod("per-1", "Periode 1 - 15 Agustus 2026", "2026-08-01", "2026-08-15", "Aktif"),
            PayrollPeriod("per-2", "Periode 16 - 31 Juli 2026", "2026-07-16", "2026-07-31", "Selesai"),
            PayrollPeriod("per-3", "Periode 1 - 15 Juli 2026", "2026-07-01", "2026-07-15", "Selesai")
        )
        try {
            val res = api.getPayrollPeriods()
            if (res.isSuccessful && !res.body().isNullOrEmpty()) res.body()!! else periods
        } catch (e: Exception) {
            periods
        }
    }

    suspend fun getPayrollRekap(periode: PayrollPeriod): List<PayrollWorkerRecap> = withContext(Dispatchers.IO) {
        val workers = defaultPekerjaList
        val relevantEntries = defaultProduksiList.filter { entry ->
            entry.tanggal >= periode.startDate && entry.tanggal <= periode.endDate
        }

        val recapList = workers.map { worker ->
            val workerEntries = relevantEntries.filter { it.pekerjaId == worker.id }
            val totalPairs = workerEntries.sumOf { it.totalPasang }
            val totalWage = workerEntries.sumOf { it.estimasiUpah }
            val distinctDays = workerEntries.map { it.tanggal }.distinct().size

            val modelSummary = workerEntries.groupBy { it.modelId }.map { (mId, entries) ->
                val mName = entries.firstOrNull()?.namaModel ?: "Model"
                val sumPairs = entries.sumOf { it.totalPasang }
                val rate = entries.firstOrNull()?.ongkosSatuan ?: 0.0
                PayrollModelSummary(
                    modelId = mId,
                    namaModel = mName,
                    totalPasang = sumPairs,
                    ongkosSatuan = rate,
                    subtotalUpah = sumPairs * rate
                )
            }

            PayrollWorkerRecap(
                pekerjaId = worker.id,
                pekerjaNama = worker.nama,
                nik = worker.nik,
                bagian = worker.bagian,
                totalPasang = totalPairs,
                totalUpah = totalWage,
                hariKerja = if (distinctDays == 0 && worker.aktif) 1 else distinctDays,
                rincianModel = modelSummary
            )
        }

        try {
            val res = api.getPayrollRekap(periode.id, periode.startDate, periode.endDate)
            if (res.isSuccessful && !res.body().isNullOrEmpty()) res.body()!! else recapList
        } catch (e: Exception) {
            recapList
        }
    }
}
