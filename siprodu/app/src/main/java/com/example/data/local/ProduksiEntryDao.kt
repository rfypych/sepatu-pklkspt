package com.example.data.local

import androidx.room.*
import com.example.data.models.ProduksiEntry
import kotlinx.coroutines.flow.Flow

@Dao
interface ProduksiEntryDao {
    @Query("SELECT * FROM produksi_entry ORDER BY createdAt DESC")
    fun getAllEntries(): Flow<List<ProduksiEntry>>

    @Query("SELECT * FROM produksi_entry WHERE tanggal = :tanggal ORDER BY createdAt DESC")
    fun getEntriesByDate(tanggal: String): Flow<List<ProduksiEntry>>

    @Query("SELECT * FROM produksi_entry WHERE tanggal LIKE :prefix || '%' ORDER BY tanggal DESC, createdAt DESC")
    fun getEntriesByMonth(prefix: String): Flow<List<ProduksiEntry>> // prefix = "2026-08"

    @Query("SELECT * FROM produksi_entry WHERE tanggal LIKE :prefix || '%' ORDER BY tanggal DESC, createdAt DESC")
    fun getEntriesByYear(prefix: String): Flow<List<ProduksiEntry>> // prefix = "2026"

    @Query("SELECT * FROM produksi_entry WHERE pekerjaId = :pekerjaId ORDER BY createdAt DESC")
    fun getEntriesByPekerja(pekerjaId: String): Flow<List<ProduksiEntry>>

    @Query("SELECT * FROM produksi_entry WHERE nomorPo = :nomorPo ORDER BY createdAt DESC")
    fun getEntriesByPO(nomorPo: String): Flow<List<ProduksiEntry>>

    @Query("SELECT * FROM produksi_entry WHERE id = :id LIMIT 1")
    suspend fun getEntryById(id: String): ProduksiEntry?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEntry(entry: ProduksiEntry)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(entries: List<ProduksiEntry>)

    @Update
    suspend fun updateEntry(entry: ProduksiEntry)

    @Delete
    suspend fun deleteEntry(entry: ProduksiEntry)

    @Query("DELETE FROM produksi_entry WHERE id = :id")
    suspend fun deleteEntryById(id: String)

    @Query("DELETE FROM produksi_entry WHERE pekerjaId = :pekerjaId AND tanggal = :tanggal")
    suspend fun deleteEntriesByWorkerAndDate(pekerjaId: String, tanggal: String)

    @Query("DELETE FROM produksi_entry")
    suspend fun deleteAll()
}
