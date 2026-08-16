package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.sqlite.db.SupportSQLiteDatabase
import com.example.data.models.DataConverters
import com.example.data.models.ModelSepatu
import com.example.data.models.Pekerja
import com.example.data.models.ProductionOrder
import com.example.data.models.ProduksiEntry
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        Pekerja::class,
        ModelSepatu::class,
        ProductionOrder::class,
        ProduksiEntry::class
    ],
    version = 2,
    exportSchema = false
)
@TypeConverters(DataConverters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun pekerjaDao(): PekerjaDao
    abstract fun modelSepatuDao(): ModelSepatuDao
    abstract fun productionOrderDao(): ProductionOrderDao
    abstract fun produksiEntryDao(): ProduksiEntryDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "siprodu_live_v2.db"
                )
                .addCallback(DatabaseCallback(scope))
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback(
            private val scope: CoroutineScope
        ) : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        populateInitialData(database)
                    }
                }
            }
        }

        suspend fun populateInitialData(database: AppDatabase) {
            val pekerjaDao = database.pekerjaDao()
            val modelDao = database.modelSepatuDao()
            val poDao = database.productionOrderDao()
            val entryDao = database.produksiEntryDao()

            pekerjaDao.deleteAll()
            modelDao.deleteAll()
            poDao.deleteAll()
            entryDao.deleteAll()

            // 1. Initial Master Workers (Matching Live Server)
            val workers = listOf(
                Pekerja(id = "1", nik = "NIK-0001", nama = "Pramono", bagian = "Produksi & Assembling", shift = 1, noHp = "081234567890"),
                Pekerja(id = "2", nik = "NIK-0002", nama = "Slamet", bagian = "Produksi & Assembling", shift = 1, noHp = "081234567891"),
                Pekerja(id = "3", nik = "NIK-0003", nama = "Wahyu", bagian = "Produksi & Assembling", shift = 1, noHp = "081234567892"),
                Pekerja(id = "4", nik = "NIK-0004", nama = "Joko", bagian = "Produksi & Assembling", shift = 1, noHp = "081234567893"),
                Pekerja(id = "5", nik = "NIK-0005", nama = "Agus", bagian = "Produksi & Assembling", shift = 1, noHp = "081234567894")
            )
            pekerjaDao.insertAll(workers)

            // 2. Initial Master Shoe Models & Rates (Matching Live Server)
            val models = listOf(
                ModelSepatu(id = "1", kodeModel = "Futsal", namaModel = "Futsal", kategori = "Model", ongkosPerPasang = 1000.0, deskripsi = "Model Futsal"),
                ModelSepatu(id = "2", kodeModel = "Brickmansion", namaModel = "Brickmansion", kategori = "Model", ongkosPerPasang = 1200.0, deskripsi = "Model Brickmansion"),
                ModelSepatu(id = "3", kodeModel = "Onrush", namaModel = "Onrush", kategori = "Model", ongkosPerPasang = 1100.0, deskripsi = "Model Onrush"),
                ModelSepatu(id = "4", kodeModel = "Superstars", namaModel = "Superstars", kategori = "Model", ongkosPerPasang = 1500.0, deskripsi = "Model Superstars")
            )
            modelDao.insertAll(models)

            // 3. Initial Active Production Orders (PO) (Matching Live Server)
            val pos = listOf(
                ProductionOrder(id = "1", nomorPo = "PO-2026-001", namaPo = "Toko Sentral", tanggalMulai = "2026-08-01", targetPasang = 1200, status = "Berjalan", catatan = "Order Toko Sentral"),
                ProductionOrder(id = "2", nomorPo = "PO-2026-002", namaPo = "Distributor Jaya", tanggalMulai = "2026-08-05", targetPasang = 800, status = "Berjalan", catatan = "Order Distributor Jaya")
            )
            poDao.insertAll(pos)
        }
    }
}
