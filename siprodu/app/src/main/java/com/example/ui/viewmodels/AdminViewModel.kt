package com.example.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.models.ModelSepatu
import com.example.data.models.Pekerja
import com.example.data.models.ProductionOrder
import com.example.data.models.ProduksiEntry
import com.example.data.repository.PabrikRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID

data class POProgressSummary(
    val po: ProductionOrder,
    val totalProduced: Int,
    val percentage: Float
)

data class WorkerWageSummary(
    val pekerja: Pekerja,
    val totalPasang: Int,
    val totalUpah: Double,
    val entries: List<ProduksiEntry>
)

data class AdminDashboardState(
    val todayPairs: Int = 0,
    val todayWages: Double = 0.0,
    val monthPairs: Int = 0,
    val monthWages: Double = 0.0,
    val activeWorkerCount: Int = 0,
    val activePOCount: Int = 0,
    val poProgressList: List<POProgressSummary> = emptyList(),
    val workerSummaries: List<WorkerWageSummary> = emptyList(),
    val selectedPeriod: String = "Bulan Ini", // "Hari Ini", "Bulan Ini", "Tahun Ini", "Semua"
    val searchQuery: String = "",
    val feedbackMsg: String? = null
)

class AdminViewModel(
    val repository: PabrikRepository
) : ViewModel() {

    val allWorkers: StateFlow<List<Pekerja>> = repository.allPekerja
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allModels: StateFlow<List<ModelSepatu>> = repository.allModels
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allPOs: StateFlow<List<ProductionOrder>> = repository.allPOs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allEntries: StateFlow<List<ProduksiEntry>> = repository.allEntries
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _dashboardState = MutableStateFlow(AdminDashboardState())
    val dashboardState: StateFlow<AdminDashboardState> = _dashboardState.asStateFlow()

    init {
        combine(
            allWorkers,
            allPOs,
            allEntries,
            _dashboardState.map { it.selectedPeriod }
        ) { workers, pos, entries, period ->
            val todayStr = repository.getTodayDateStr()
            val monthStr = repository.getCurrentMonthPrefix()

            val todayEntries = entries.filter { it.tanggal == todayStr }
            val monthEntries = entries.filter { it.tanggal.startsWith(monthStr) }

            val todayPairs = todayEntries.sumOf { it.totalPasang }
            val todayWages = todayEntries.sumOf { it.estimasiUpah }
            val monthPairs = monthEntries.sumOf { it.totalPasang }
            val monthWages = monthEntries.sumOf { it.estimasiUpah }

            // Calculate PO Progress
            val poProgress = pos.map { po ->
                val producedForPo = entries.filter { it.nomorPo.equals(po.nomorPo, ignoreCase = true) }.sumOf { it.totalPasang }
                val pct = if (po.targetPasang > 0) (producedForPo.toFloat() / po.targetPasang.toFloat()).coerceIn(0f, 1f) else 0f
                POProgressSummary(po, producedForPo, pct)
            }

            // Filter entries for Worker Wage Summary based on period
            val filteredEntries = when (period) {
                "Hari Ini" -> todayEntries
                "Bulan Ini" -> monthEntries
                "Tahun Ini" -> entries.filter { it.tanggal.startsWith(repository.getCurrentYearPrefix()) }
                else -> entries
            }

            val workerSummaries = workers.map { w ->
                val wEntries = filteredEntries.filter { it.pekerjaId == w.id }
                val totalPsg = wEntries.sumOf { it.totalPasang }
                val totalUph = wEntries.sumOf { it.estimasiUpah }
                WorkerWageSummary(w, totalPsg, totalUph, wEntries)
            }.sortedByDescending { it.totalUpah }

            _dashboardState.update {
                it.copy(
                    todayPairs = todayPairs,
                    todayWages = todayWages,
                    monthPairs = monthPairs,
                    monthWages = monthWages,
                    activeWorkerCount = workers.count { w -> w.aktif },
                    activePOCount = pos.count { p -> p.status == "Proses" },
                    poProgressList = poProgress,
                    workerSummaries = workerSummaries
                )
            }
        }.launchIn(viewModelScope)
    }

    fun setPeriod(period: String) {
        _dashboardState.update { it.copy(selectedPeriod = period) }
    }

    fun setSearchQuery(query: String) {
        _dashboardState.update { it.copy(searchQuery = query) }
    }

    fun clearFeedback() {
        _dashboardState.update { it.copy(feedbackMsg = null) }
    }

    // Master Worker CRUD
    fun addWorker(nama: String, shift: Int) {
        viewModelScope.launch {
            val newWorker = Pekerja(
                nik = "",
                nama = nama.trim(),
                bagian = "",
                shift = shift,
                noHp = "",
                aktif = true
            )
            repository.savePekerja(newWorker)
            _dashboardState.update { it.copy(feedbackMsg = "Pekerja ${nama.trim()} berhasil ditambahkan.") }
        }
    }

    fun updateWorker(pekerja: Pekerja) {
        viewModelScope.launch {
            repository.updatePekerja(pekerja)
            _dashboardState.update { it.copy(feedbackMsg = "Data pekerja ${pekerja.nama} diperbarui.") }
        }
    }

    fun toggleWorkerStatus(pekerja: Pekerja) {
        viewModelScope.launch {
            val updated = pekerja.copy(aktif = !pekerja.aktif)
            repository.updatePekerja(updated)
            _dashboardState.update {
                it.copy(
                    feedbackMsg = if (updated.aktif) "Pekerja ${pekerja.nama} diaktifkan." else "Pekerja ${pekerja.nama} dinonaktifkan."
                )
            }
        }
    }

    fun deleteWorker(id: String) {
        viewModelScope.launch {
            repository.deletePekerja(id)
            _dashboardState.update { it.copy(feedbackMsg = "Pekerja berhasil dihapus.") }
        }
    }

    // Master Model CRUD
    fun addModel(kode: String, nama: String, kategori: String, ongkos: Double, deskripsi: String) {
        viewModelScope.launch {
            val newModel = ModelSepatu(
                kodeModel = kode.trim().uppercase(),
                namaModel = nama.trim(),
                kategori = kategori,
                ongkosPerPasang = ongkos,
                deskripsi = deskripsi.trim()
            )
            repository.saveModel(newModel)
            _dashboardState.update { it.copy(feedbackMsg = "Model ${nama.trim()} berhasil ditambahkan.") }
        }
    }

    fun updateModel(model: ModelSepatu) {
        viewModelScope.launch {
            repository.updateModel(model)
            _dashboardState.update { it.copy(feedbackMsg = "Model ${model.namaModel} diperbarui.") }
        }
    }

    fun deleteModel(id: String) {
        viewModelScope.launch {
            repository.deleteModel(id)
            _dashboardState.update { it.copy(feedbackMsg = "Model berhasil dihapus.") }
        }
    }

    // Master PO CRUD
    fun addPO(nomorPo: String, namaPo: String, targetPasang: Int, status: String, catatan: String) {
        viewModelScope.launch {
            val newPO = ProductionOrder(
                nomorPo = nomorPo.trim().uppercase(),
                namaPo = namaPo.trim(),
                tanggalMulai = repository.getTodayDateStr(),
                targetPasang = targetPasang,
                status = status,
                catatan = catatan.trim()
            )
            repository.savePO(newPO)
            _dashboardState.update { it.copy(feedbackMsg = "PO ${nomorPo.trim()} berhasil ditambahkan.") }
        }
    }

    fun updatePO(po: ProductionOrder) {
        viewModelScope.launch {
            repository.updatePO(po)
            _dashboardState.update { it.copy(feedbackMsg = "PO ${po.nomorPo} diperbarui.") }
        }
    }

    fun togglePOStatus(po: ProductionOrder) {
        viewModelScope.launch {
            val nextStatus = if (po.status == "Proses") "Selesai" else "Proses"
            val updated = po.copy(status = nextStatus)
            repository.updatePO(updated)
            _dashboardState.update { it.copy(feedbackMsg = "Status PO ${po.nomorPo} diubah ke $nextStatus.") }
        }
    }

    fun deletePO(id: String) {
        viewModelScope.launch {
            repository.deletePO(id)
            _dashboardState.update { it.copy(feedbackMsg = "PO berhasil dihapus.") }
        }
    }

    fun resetData() {
        viewModelScope.launch {
            repository.resetDatabaseToInitial()
            _dashboardState.update { it.copy(feedbackMsg = "Data pabrik berhasil di-reset ke data default.") }
        }
    }
}
