package com.example.data.local

import androidx.room.*
import com.example.data.models.Pekerja
import kotlinx.coroutines.flow.Flow

@Dao
interface PekerjaDao {
    @Query("SELECT * FROM pekerja ORDER BY aktif DESC, nama ASC")
    fun getAllPekerja(): Flow<List<Pekerja>>

    @Query("SELECT * FROM pekerja WHERE aktif = 1 ORDER BY shift ASC, nama ASC")
    fun getActivePekerja(): Flow<List<Pekerja>>

    @Query("SELECT * FROM pekerja WHERE id = :id LIMIT 1")
    suspend fun getPekerjaById(id: String): Pekerja?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPekerja(pekerja: Pekerja)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(pekerjaList: List<Pekerja>)

    @Update
    suspend fun updatePekerja(pekerja: Pekerja)

    @Delete
    suspend fun deletePekerja(pekerja: Pekerja)

    @Query("DELETE FROM pekerja WHERE id = :id")
    suspend fun deletePekerjaById(id: String)

    @Query("DELETE FROM pekerja")
    suspend fun deleteAll()
}
