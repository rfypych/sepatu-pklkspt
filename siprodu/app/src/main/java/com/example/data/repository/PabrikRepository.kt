package com.example.data.repository

import android.content.Context
import android.util.Log
import com.example.data.api.ApiClient
import com.example.data.api.ApiService
import com.example.data.local.AppDatabase
import com.example.data.models.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class PabrikRepository(
    private val database: AppDatabase,
    private val scope: CoroutineScope
) {
    private val pekerjaDao = database.pekerjaDao()
    private val modelDao = database.modelSepatuDao()
    private val poDao = database.productionOrderDao()
    private val entryDao = database.produksiEntryDao()
    private val api: ApiService by lazy { ApiClient.getService() }

    init {
        scope.launch(Dispatchers.IO) {
            syncFromRemote()
        }
    }

    companion object {
        @Volatile
        private var INSTANCE: PabrikRepository? = null

        fun getInstance(context: Context, scope: CoroutineScope): PabrikRepository {
            return INSTANCE ?: synchronized(this) {
                ApiClient.initialize(context)
                val db = AppDatabase.getDatabase(context, scope)
                val instance = PabrikRepository(db, scope)
                INSTANCE = instance
                instance
            }
        }
    }

    // Helper Date Strings
    fun getTodayDateStr(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    }

    fun getCurrentMonthPrefix(): String {
        return SimpleDateFormat("yyyy-MM", Locale.getDefault()).format(Date())
    }

    fun getCurrentYearPrefix(): String {
        return SimpleDateFormat("yyyy", Locale.getDefault()).format(Date())
    }

    // Full 2-Way Sync with Backend Database
    suspend fun syncFromRemote() = withContext(Dispatchers.IO) {
        ensureAuthToken()

        try {
            val pekerjaRes = api.getPekerja()
            if (pekerjaRes.isSuccessful && !pekerjaRes.body().isNullOrEmpty()) {
                pekerjaDao.deleteAll()
                pekerjaDao.insertAll(pekerjaRes.body()!!)
                Log.d("PabrikRepo", "Synced ${pekerjaRes.body()!!.size} workers from server")
            }
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Sync pekerja failed: ${e.message}")
        }

        try {
            val modelRes = api.getModel()
            if (modelRes.isSuccessful && !modelRes.body().isNullOrEmpty()) {
                modelDao.deleteAll()
                modelDao.insertAll(modelRes.body()!!)
                Log.d("PabrikRepo", "Synced ${modelRes.body()!!.size} models from server")
            }
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Sync model failed: ${e.message}")
        }

        try {
            val poRes = api.getPO()
            if (poRes.isSuccessful && !poRes.body().isNullOrEmpty()) {
                poDao.deleteAll()
                poDao.insertAll(poRes.body()!!)
                Log.d("PabrikRepo", "Synced ${poRes.body()!!.size} POs from server")
            }
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Sync PO failed: ${e.message}")
        }

        try {
            val prodRes = api.getProduksi()
            if (prodRes.isSuccessful && !prodRes.body().isNullOrEmpty()) {
                entryDao.deleteAll()
                entryDao.insertAll(prodRes.body()!!)
                Log.d("PabrikRepo", "Synced ${prodRes.body()!!.size} production records from server")
            }
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Sync produksi failed: ${e.message}")
        }
    }

    private suspend fun ensureAuthToken() {
        if (ApiClient.getToken().isNullOrEmpty()) {
            try {
                val res = api.login(LoginRequest("mandor", "mandor123"))
                if (res.isSuccessful && res.body() != null) {
                    val body = res.body()!!
                    if (!body.token.isNullOrEmpty() && body.user != null) {
                        ApiClient.saveAuthSession(body.token, body.user)
                    }
                }
            } catch (e: Exception) {
                Log.w("PabrikRepo", "Auto-login failed: ${e.message}")
            }
        }
    }

    // Pekerja Operations
    val allPekerja: Flow<List<Pekerja>> = pekerjaDao.getAllPekerja()
    val activePekerja: Flow<List<Pekerja>> = pekerjaDao.getActivePekerja()

    suspend fun savePekerja(pekerja: Pekerja) = withContext(Dispatchers.IO) {
        val newPekerja = if (pekerja.id.isBlank()) pekerja.copy(id = "p-${System.currentTimeMillis()}") else pekerja
        pekerjaDao.insertPekerja(newPekerja)
        try {
            api.createPekerja(newPekerja)
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Remote createPekerja failed: ${e.message}")
        }
    }

    suspend fun updatePekerja(pekerja: Pekerja) = withContext(Dispatchers.IO) {
        pekerjaDao.updatePekerja(pekerja)
        try {
            api.updatePekerja(pekerja.id, pekerja)
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Remote updatePekerja failed: ${e.message}")
        }
    }

    suspend fun deletePekerja(id: String) = withContext(Dispatchers.IO) {
        pekerjaDao.deletePekerjaById(id)
        try {
            api.deletePekerja(id)
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Remote deletePekerja failed: ${e.message}")
        }
    }

    // Model Sepatu Operations
    val allModels: Flow<List<ModelSepatu>> = modelDao.getAllModels()

    suspend fun saveModel(model: ModelSepatu) = withContext(Dispatchers.IO) {
        val newModel = if (model.id.isBlank()) model.copy(id = "m-${System.currentTimeMillis()}") else model
        modelDao.insertModel(newModel)
        try {
            api.createModel(newModel)
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Remote createModel failed: ${e.message}")
        }
    }

    suspend fun updateModel(model: ModelSepatu) = withContext(Dispatchers.IO) {
        modelDao.updateModel(model)
        try {
            api.updateModel(model.id, model)
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Remote updateModel failed: ${e.message}")
        }
    }

    suspend fun deleteModel(id: String) = withContext(Dispatchers.IO) {
        modelDao.deleteModelById(id)
        try {
            api.deleteModel(id)
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Remote deleteModel failed: ${e.message}")
        }
    }

    // PO Operations
    val allPOs: Flow<List<ProductionOrder>> = poDao.getAllPOs()
    val activePOs: Flow<List<ProductionOrder>> = poDao.getActivePOs()

    suspend fun savePO(po: ProductionOrder) = withContext(Dispatchers.IO) {
        val newPo = if (po.id.isBlank()) po.copy(id = "po-${System.currentTimeMillis()}") else po
        poDao.insertPO(newPo)
        try {
            api.createPO(newPo)
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Remote createPO failed: ${e.message}")
        }
    }

    suspend fun updatePO(po: ProductionOrder) = withContext(Dispatchers.IO) {
        poDao.updatePO(po)
        try {
            api.updatePO(po.id, po)
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Remote updatePO failed: ${e.message}")
        }
    }

    suspend fun deletePO(id: String) = withContext(Dispatchers.IO) {
        poDao.deletePOById(id)
        try {
            api.deletePO(id)
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Remote deletePO failed: ${e.message}")
        }
    }

    // Produksi Operations
    val allEntries: Flow<List<ProduksiEntry>> = entryDao.getAllEntries()

    fun getTodayEntries(): Flow<List<ProduksiEntry>> {
        return entryDao.getEntriesByDate(getTodayDateStr())
    }

    fun getEntriesByDate(dateStr: String): Flow<List<ProduksiEntry>> {
        return entryDao.getEntriesByDate(dateStr)
    }

    fun getEntriesByMonth(monthPrefix: String): Flow<List<ProduksiEntry>> {
        return entryDao.getEntriesByMonth(monthPrefix)
    }

    fun getEntriesByYear(yearPrefix: String): Flow<List<ProduksiEntry>> {
        return entryDao.getEntriesByYear(yearPrefix)
    }

    fun getEntriesByPekerja(pekerjaId: String): Flow<List<ProduksiEntry>> {
        return entryDao.getEntriesByPekerja(pekerjaId)
    }

    fun getEntriesByPO(nomorPo: String): Flow<List<ProduksiEntry>> {
        return entryDao.getEntriesByPO(nomorPo)
    }

    suspend fun saveProduksiEntry(entry: ProduksiEntry) = withContext(Dispatchers.IO) {
        entryDao.insertEntry(entry)
        try {
            api.createProduksi(entry)
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Remote createProduksi failed: ${e.message}")
        }
    }

    suspend fun saveBatchProduksi(entries: List<ProduksiEntry>) = withContext(Dispatchers.IO) {
        if (entries.isNotEmpty()) {
            val first = entries.first()
            entryDao.deleteEntriesByWorkerAndDate(first.pekerjaId, first.tanggal)
            entryDao.insertAll(entries)

            val items = entries.map {
                BatchProduksiItem(
                    modelId = it.modelId,
                    namaModel = it.namaModel,
                    ongkosSatuan = it.ongkosSatuan,
                    sizes = it.sizes
                )
            }
            val req = BatchProduksiRequest(
                pekerjaId = first.pekerjaId,
                poId = first.poId,
                shift = first.shift,
                tanggal = first.tanggal,
                items = items,
                catatan = first.catatan
            )
            try {
                api.submitBatchProduksi(req)
                val prodRes = api.getProduksiHariIni()
                if (prodRes.isSuccessful && prodRes.body() != null) {
                    entryDao.deleteAll()
                    entryDao.insertAll(prodRes.body()!!)
                }
            } catch (e: Exception) {
                Log.w("PabrikRepo", "Remote submitBatchProduksi or sync failed: ${e.message}")
            }
        }
    }

    suspend fun updateProduksiEntry(entry: ProduksiEntry) = withContext(Dispatchers.IO) {
        entryDao.updateEntry(entry)
        try {
            api.updateProduksi(entry.id, entry)
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Remote updateProduksi failed: ${e.message}")
        }
    }

    suspend fun deleteProduksiEntry(id: String) = withContext(Dispatchers.IO) {
        entryDao.deleteEntryById(id)
        try {
            api.deleteProduksi(id)
        } catch (e: Exception) {
            Log.w("PabrikRepo", "Remote deleteProduksi failed: ${e.message}")
        }
    }

    suspend fun resetDatabaseToInitial() = withContext(Dispatchers.IO) {
        AppDatabase.populateInitialData(database)
        syncFromRemote()
    }
}
