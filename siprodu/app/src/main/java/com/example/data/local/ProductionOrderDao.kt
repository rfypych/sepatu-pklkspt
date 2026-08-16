package com.example.data.local

import androidx.room.*
import com.example.data.models.ProductionOrder
import kotlinx.coroutines.flow.Flow

@Dao
interface ProductionOrderDao {
    @Query("SELECT * FROM production_order ORDER BY tanggalMulai DESC, nomorPo DESC")
    fun getAllPOs(): Flow<List<ProductionOrder>>

    @Query("SELECT * FROM production_order WHERE status = 'Proses' ORDER BY nomorPo ASC")
    fun getActivePOs(): Flow<List<ProductionOrder>>

    @Query("SELECT * FROM production_order WHERE id = :id LIMIT 1")
    suspend fun getPOById(id: String): ProductionOrder?

    @Query("SELECT * FROM production_order WHERE nomorPo = :nomorPo LIMIT 1")
    suspend fun getPOByNomor(nomorPo: String): ProductionOrder?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPO(po: ProductionOrder)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(pos: List<ProductionOrder>)

    @Update
    suspend fun updatePO(po: ProductionOrder)

    @Delete
    suspend fun deletePO(po: ProductionOrder)

    @Query("DELETE FROM production_order WHERE id = :id")
    suspend fun deletePOById(id: String)

    @Query("DELETE FROM production_order")
    suspend fun deleteAll()
}
