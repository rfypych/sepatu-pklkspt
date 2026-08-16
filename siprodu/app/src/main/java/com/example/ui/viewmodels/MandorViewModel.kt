package com.example.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.models.BatchDraftItem
import com.example.data.models.ModelSepatu
import com.example.data.models.Pekerja
import com.example.data.models.ProductionOrder
import com.example.data.models.ProduksiEntry
import com.example.data.repository.PabrikRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID

data class DraftModelEntry(
    val id: String = java.util.UUID.randomUUID().toString(),
    val model: ModelSepatu,
    val sizeMap: Map<String, Int> = mapOf(
        "36" to 0, "37" to 0, "38" to 0, "39" to 0, "40" to 0,
        "41" to 0, "42" to 0, "43" to 0, "44" to 0
    )
) {
    val totalPasang: Int get() = sizeMap.values.sum()
    val totalUpah: Double get() = totalPasang * model.ongkosPerPasang
}

data class MandorInputState(
    val selectedWorker: Pekerja? = null,
    val selectedShift: Int = 1, // 1: Pagi, 2: Siang/Malam
    val selectedPO: ProductionOrder? = null,
    val draftModels: List<DraftModelEntry> = emptyList(),
    val savedInitialPairs: Int = 0,
    val hasModified: Boolean = false,
    val isSubmitting: Boolean = false,
    val submitSuccessMsg: String? = null,
    val submitErrorMsg: String? = null
)

data class MandorRiwayatState(
    val filterType: String = "Harian", // "Harian", "Bulanan", "Tahunan"
    val items: List<ProduksiEntry> = emptyList(),
    val totalPasang: Int = 0,
    val totalUpah: Double = 0.0,
    val isLoading: Boolean = false,
    val actionSuccessMsg: String? = null
)

class MandorViewModel(
    val repository: PabrikRepository
) : ViewModel() {

    val activeWorkers: StateFlow<List<Pekerja>> = repository.activePekerja
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allPOs: StateFlow<List<ProductionOrder>> = repository.allPOs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allModels: StateFlow<List<ModelSepatu>> = repository.allModels
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val todayEntries: StateFlow<List<ProduksiEntry>> = repository.getTodayEntries()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _inputState = MutableStateFlow(MandorInputState())
    val inputState: StateFlow<MandorInputState> = _inputState.asStateFlow()

    private val _riwayatState = MutableStateFlow(MandorRiwayatState())
    val riwayatState: StateFlow<MandorRiwayatState> = _riwayatState.asStateFlow()

    init {
        refreshRiwayat()
    }

    fun selectWorker(worker: Pekerja) {
        val workerTodayEntries = todayEntries.value.filter { it.pekerjaId == worker.id }
        if (workerTodayEntries.isNotEmpty()) {
            val savedShift = workerTodayEntries.first().shift
            val savedPoNum = workerTodayEntries.first().nomorPo
            val savedPoId = workerTodayEntries.first().poId
            val matchedPO = allPOs.value.find { it.nomorPo == savedPoNum || (savedPoId.isNotBlank() && it.id == savedPoId) }

            val modelsList = allModels.value
            val loadedDrafts = workerTodayEntries.map { entry ->
                val foundModel = modelsList.find { it.id == entry.modelId || it.namaModel.equals(entry.namaModel, ignoreCase = true) }
                    ?: ModelSepatu(
                        id = entry.modelId,
                        namaModel = entry.namaModel,
                        ongkosPerPasang = entry.ongkosSatuan
                    )
                DraftModelEntry(
                    id = entry.id,
                    model = foundModel,
                    sizeMap = entry.sizes.toMap()
                )
            }
            val totalSaved = loadedDrafts.sumOf { it.totalPasang }
            _inputState.update {
                it.copy(
                    selectedWorker = worker,
                    selectedShift = savedShift,
                    selectedPO = matchedPO,
                    draftModels = loadedDrafts,
                    savedInitialPairs = totalSaved,
                    hasModified = false,
                    submitSuccessMsg = null,
                    submitErrorMsg = null
                )
            }
        } else {
            _inputState.update {
                it.copy(
                    selectedWorker = worker,
                    selectedShift = worker.shift,
                    selectedPO = null,
                    draftModels = emptyList(),
                    savedInitialPairs = 0,
                    hasModified = false,
                    submitSuccessMsg = null,
                    submitErrorMsg = null
                )
            }
        }
    }

    fun clearSelectedWorker() {
        _inputState.update {
            it.copy(
                selectedWorker = null,
                draftModels = emptyList(),
                savedInitialPairs = 0,
                hasModified = false
            )
        }
    }

    fun setShift(shift: Int) {
        _inputState.update { it.copy(selectedShift = shift, hasModified = true) }
    }

    fun selectPO(po: ProductionOrder?) {
        _inputState.update { it.copy(selectedPO = po, hasModified = true) }
    }

    fun addModel(model: ModelSepatu) {
        val newEntry = DraftModelEntry(
            model = model,
            sizeMap = mapOf(
                "36" to 0, "37" to 0, "38" to 0, "39" to 0, "40" to 0,
                "41" to 0, "42" to 0, "43" to 0, "44" to 0
            )
        )
        _inputState.update { it.copy(draftModels = it.draftModels + newEntry, hasModified = true) }
    }

    fun removeModel(entryId: String) {
        _inputState.update {
            it.copy(draftModels = it.draftModels.filter { item -> item.id != entryId }, hasModified = true)
        }
    }

    fun updateModelSizeQuantity(entryId: String, size: String, quantity: Int) {
        _inputState.update { state ->
            val updated = state.draftModels.map { entry ->
                if (entry.id == entryId) {
                    val map = entry.sizeMap.toMutableMap()
                    map[size] = quantity.coerceAtLeast(0)
                    entry.copy(sizeMap = map)
                } else {
                    entry
                }
            }
            state.copy(draftModels = updated, hasModified = true)
        }
    }

    fun quickAddPO(nomorPo: String, namaPo: String, targetPasang: Int) {
        viewModelScope.launch {
            val newPo = ProductionOrder(
                nomorPo = nomorPo,
                namaPo = namaPo,
                tanggalMulai = repository.getTodayDateStr(),
                targetPasang = targetPasang,
                status = "Berjalan"
            )
            repository.savePO(newPo)
            _inputState.update { it.copy(selectedPO = newPo, hasModified = true) }
        }
    }

    fun submitProduksi() {
        val state = _inputState.value
        val worker = state.selectedWorker ?: run {
            _inputState.update { it.copy(submitErrorMsg = "Pilih pekerja terlebih dahulu.") }
            return
        }

        val activeEntries = state.draftModels.filter { it.totalPasang > 0 }
        if (activeEntries.isEmpty()) {
            _inputState.update { it.copy(submitErrorMsg = "Masukkan jumlah pasang sepatu pada model yang dipilih.") }
            return
        }

        _inputState.update { it.copy(isSubmitting = true, submitErrorMsg = null) }

        viewModelScope.launch {
            try {
                val todayStr = repository.getTodayDateStr()
                val entriesToSave = activeEntries.map { entry ->
                    val activeSizes = entry.sizeMap.filter { it.value > 0 }
                    ProduksiEntry(
                        id = if (entry.id.isNotBlank()) entry.id else UUID.randomUUID().toString(),
                        tanggal = todayStr,
                        pekerjaId = worker.id,
                        pekerjaNama = worker.nama,
                        shift = state.selectedShift,
                        poId = state.selectedPO?.id ?: "",
                        nomorPo = state.selectedPO?.nomorPo ?: "",
                        modelId = entry.model.id,
                        namaModel = entry.model.namaModel,
                        ongkosSatuan = entry.model.ongkosPerPasang,
                        sizesJson = activeSizes.entries.joinToString(",") { "${it.key}:${it.value}" },
                        sizes = com.example.data.models.SizeBreakdown.fromMap(activeSizes),
                        totalPasang = entry.totalPasang,
                        estimasiUpah = entry.totalUpah,
                        catatan = null,
                        mandorNama = "Mandor",
                        timestamp = System.currentTimeMillis()
                    )
                }

                repository.saveBatchProduksi(entriesToSave)

                val grandTotalPairs = entriesToSave.sumOf { it.totalPasang }
                _inputState.update {
                    it.copy(
                        isSubmitting = false,
                        savedInitialPairs = grandTotalPairs,
                        hasModified = false,
                        submitSuccessMsg = "Berhasil mencatat $grandTotalPairs pasang untuk ${worker.nama}!"
                    )
                }
                refreshRiwayat()
            } catch (e: Exception) {
                _inputState.update {
                    it.copy(
                        isSubmitting = false,
                        submitErrorMsg = "Gagal menyimpan: ${e.message}"
                    )
                }
            }
        }
    }

    fun clearMessages() {
        _inputState.update { it.copy(submitSuccessMsg = null, submitErrorMsg = null) }
        _riwayatState.update { it.copy(actionSuccessMsg = null) }
    }

    fun setRiwayatFilter(filter: String) {
        _riwayatState.update { it.copy(filterType = filter) }
        refreshRiwayat()
    }

    fun refreshRiwayat() {
        val filter = _riwayatState.value.filterType
        viewModelScope.launch {
            try {
                repository.syncFromRemote()
            } catch (_: Exception) {
            }
            _riwayatState.update { it.copy(isLoading = true) }
            val flow = when (filter) {
                "Bulanan" -> repository.getEntriesByMonth(repository.getCurrentMonthPrefix())
                "Tahunan" -> repository.getEntriesByYear(repository.getCurrentYearPrefix())
                else -> repository.getTodayEntries()
            }

            flow.collectLatest { list ->
                val totalPasang = list.sumOf { it.totalPasang }
                val totalUpah = list.sumOf { it.estimasiUpah }
                _riwayatState.update {
                    it.copy(
                        items = list,
                        totalPasang = totalPasang,
                        totalUpah = totalUpah,
                        isLoading = false
                    )
                }
            }
        }
    }

    fun updateProduksiRecord(entry: ProduksiEntry) {
        viewModelScope.launch {
            repository.updateProduksiEntry(entry)
            _riwayatState.update { it.copy(actionSuccessMsg = "Berhasil memperbarui data produksi.") }
            refreshRiwayat()
        }
    }

    fun deleteProduksiRecord(id: String) {
        viewModelScope.launch {
            repository.deleteProduksiEntry(id)
            _riwayatState.update { it.copy(actionSuccessMsg = "Data produksi berhasil dihapus.") }
            refreshRiwayat()
        }
    }
}
