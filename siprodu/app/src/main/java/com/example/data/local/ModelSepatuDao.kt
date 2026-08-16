package com.example.data.local

import androidx.room.*
import com.example.data.models.ModelSepatu
import kotlinx.coroutines.flow.Flow

@Dao
interface ModelSepatuDao {
    @Query("SELECT * FROM model_sepatu ORDER BY namaModel ASC")
    fun getAllModels(): Flow<List<ModelSepatu>>

    @Query("SELECT * FROM model_sepatu WHERE id = :id LIMIT 1")
    suspend fun getModelById(id: String): ModelSepatu?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertModel(model: ModelSepatu)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(models: List<ModelSepatu>)

    @Update
    suspend fun updateModel(model: ModelSepatu)

    @Delete
    suspend fun deleteModel(model: ModelSepatu)

    @Query("DELETE FROM model_sepatu WHERE id = :id")
    suspend fun deleteModelById(id: String)

    @Query("DELETE FROM model_sepatu")
    suspend fun deleteAll()
}
