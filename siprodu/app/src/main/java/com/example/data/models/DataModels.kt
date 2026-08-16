package com.example.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory

@JsonClass(generateAdapter = true)
data class LoginRequest(
    @Json(name = "username") val username: String,
    @Json(name = "password") val password: String
)

@JsonClass(generateAdapter = true)
data class LoginResponse(
    @Json(name = "success") val success: Boolean? = true,
    @Json(name = "message") val message: String? = null,
    @Json(name = "token") val token: String? = null,
    @Json(name = "user") val user: UserProfile? = null,
    @Json(name = "role") val role: String? = null
)

@JsonClass(generateAdapter = true)
data class UserProfile(
    @Json(name = "id") val id: String = "",
    @Json(name = "username") val username: String = "",
    @Json(name = "nama") val nama: String = "",
    @Json(name = "role") val role: String = "mandor", // "mandor" or "admin"
    @Json(name = "shift") val shift: Int? = 1,
    @Json(name = "bagian") val bagian: String? = "Assembling",
    val namaLengkap: String = nama
)

@Entity(tableName = "pekerja")
@JsonClass(generateAdapter = true)
data class Pekerja(
    @PrimaryKey @Json(name = "id") val id: String = "",
    @Json(name = "nama") val nama: String = "",
    @Json(name = "nik") val nik: String = "",
    @Json(name = "bagian") val bagian: String = "Assembling",
    @Json(name = "shift") val shift: Int = 1,
    @Json(name = "aktif") val aktif: Boolean = true,
    @Json(name = "nomor_hp") val noHp: String? = null,
    @Json(name = "foto_url") val fotoUrl: String? = null,
    @Json(name = "status_aktif") val statusAktif: Boolean = aktif
)

@Entity(tableName = "model_sepatu")
@JsonClass(generateAdapter = true)
data class ModelSepatu(
    @PrimaryKey @Json(name = "id") val id: String = "",
    @Json(name = "kode_model") val kodeModel: String = "",
    @Json(name = "nama_model") val namaModel: String = "",
    @Json(name = "kategori") val kategori: String = "Sneakers",
    @Json(name = "ongkos_per_pasang") val ongkosPerPasang: Double = 0.0,
    @Json(name = "deskripsi") val deskripsi: String? = null
)

@Entity(tableName = "production_order")
@JsonClass(generateAdapter = true)
data class ProductionOrder(
    @PrimaryKey @Json(name = "id") val id: String = "",
    @Json(name = "nomor_po") val nomorPo: String = "",
    @Json(name = "nama_po") val namaPo: String = "",
    @Json(name = "target_pasang") val targetPasang: Int = 0,
    @Json(name = "selesai_pasang") val selesaiPasang: Int = 0,
    @Json(name = "deadline") val deadline: String? = null,
    @Json(name = "status") val status: String = "Berjalan", // "Berjalan", "Selesai", "Tertunda"
    @Json(name = "tanggal_mulai") val tanggalMulai: String? = null,
    @Json(name = "catatan") val catatan: String? = null
)

@JsonClass(generateAdapter = true)
data class SizeBreakdown(
    @Json(name = "36") val s36: Int = 0,
    @Json(name = "37") val s37: Int = 0,
    @Json(name = "38") val s38: Int = 0,
    @Json(name = "39") val s39: Int = 0,
    @Json(name = "40") val s40: Int = 0,
    @Json(name = "41") val s41: Int = 0,
    @Json(name = "42") val s42: Int = 0,
    @Json(name = "43") val s43: Int = 0,
    @Json(name = "44") val s44: Int = 0
) {
    fun totalPairs(): Int = s36 + s37 + s38 + s39 + s40 + s41 + s42 + s43 + s44

    fun toMap(): Map<String, Int> {
        return mapOf(
            "36" to s36,
            "37" to s37,
            "38" to s38,
            "39" to s39,
            "40" to s40,
            "41" to s41,
            "42" to s42,
            "43" to s43,
            "44" to s44
        )
    }

    companion object {
        fun fromMap(map: Map<String, Int>): SizeBreakdown {
            return SizeBreakdown(
                s36 = map["36"] ?: 0,
                s37 = map["37"] ?: 0,
                s38 = map["38"] ?: 0,
                s39 = map["39"] ?: 0,
                s40 = map["40"] ?: 0,
                s41 = map["41"] ?: 0,
                s42 = map["42"] ?: 0,
                s43 = map["43"] ?: 0,
                s44 = map["44"] ?: 0
            )
        }
    }
}

@Entity(tableName = "produksi_entry")
@JsonClass(generateAdapter = true)
data class ProduksiEntry(
    @PrimaryKey @Json(name = "id") val id: String = "",
    @Json(name = "pekerja_id") val pekerjaId: String = "",
    @Json(name = "pekerja_nama") val pekerjaNama: String = "",
    @Json(name = "po_id") val poId: String = "",
    @Json(name = "nomor_po") val nomorPo: String = "",
    @Json(name = "model_id") val modelId: String = "",
    @Json(name = "nama_model") val namaModel: String = "",
    @Json(name = "shift") val shift: Int = 1,
    @Json(name = "tanggal") val tanggal: String = "",
    @Json(name = "sizes") val sizes: SizeBreakdown = SizeBreakdown(),
    @Json(name = "sizes_json") val sizesJson: String? = null, // Temporary legacy support
    @Json(name = "total_pasang") val totalPasang: Int = 0,
    @Json(name = "ongkos_satuan") val ongkosSatuan: Double = 0.0,
    @Json(name = "estimasi_upah") val estimasiUpah: Double = 0.0,
    @Json(name = "catatan") val catatan: String? = null,
    @Json(name = "created_at") val createdAt: String? = null,
    @Json(name = "mandor_nama") val mandorNama: String? = "Mandor Agus",
    val timestamp: Long = System.currentTimeMillis()
)

// In-Memory Draft Item for Multi-Model Batch Input
data class BatchDraftItem(
    val id: String = java.util.UUID.randomUUID().toString(),
    val model: ModelSepatu,
    val nomorPo: String,
    val sizes: SizeBreakdown,
    val shift: Int
) {
    constructor(
        id: String = java.util.UUID.randomUUID().toString(),
        model: ModelSepatu,
        nomorPo: String,
        sizes: Map<String, Int>,
        shift: Int
    ) : this(id, model, nomorPo, SizeBreakdown.fromMap(sizes), shift)

    val namaModel: String get() = model.namaModel
    val ongkosSatuan: Double get() = model.ongkosPerPasang
    val totalPasang: Int get() = sizes.totalPairs()
    val totalUpah: Double get() = totalPasang * ongkosSatuan

    fun toSizesJson(): String {
        return sizes.toMap().entries
            .filter { it.value > 0 }
            .joinToString(",") { "${it.key}:${it.value}" }
    }
}

class DataConverters {
    private val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
    private val adapter = moshi.adapter(SizeBreakdown::class.java)

    @TypeConverter
    fun fromSizeBreakdown(value: SizeBreakdown): String {
        return adapter.toJson(value)
    }

    @TypeConverter
    fun toSizeBreakdown(value: String): SizeBreakdown {
        return adapter.fromJson(value) ?: SizeBreakdown()
    }
}

@JsonClass(generateAdapter = true)
data class BatchProduksiItem(
    @Json(name = "model_id") val modelId: String,
    @Json(name = "nama_model") val namaModel: String,
    @Json(name = "ongkos_satuan") val ongkosSatuan: Double,
    @Json(name = "sizes") val sizes: SizeBreakdown
) {
    val totalPasang: Int get() = sizes.totalPairs()
    val totalUpah: Double get() = totalPasang * ongkosSatuan
}

@JsonClass(generateAdapter = true)
data class BatchProduksiRequest(
    @Json(name = "pekerja_id") val pekerjaId: String,
    @Json(name = "po_id") val poId: String,
    @Json(name = "shift") val shift: Int,
    @Json(name = "tanggal") val tanggal: String,
    @Json(name = "items") val items: List<BatchProduksiItem>,
    @Json(name = "catatan") val catatan: String? = null
)

@JsonClass(generateAdapter = true)
data class DashboardTodayResponse(
    @Json(name = "total_pasang") val totalPasang: Int = 0,
    @Json(name = "estimasi_upah") val estimasiUpah: Double = 0.0,
    @Json(name = "pekerja_aktif_count") val pekerjaAktifCount: Int = 0,
    @Json(name = "po_berjalan_count") val poBerjalanCount: Int = 0,
    @Json(name = "shift_1_pasang") val shift1Pasang: Int = 0,
    @Json(name = "shift_2_pasang") val shift2Pasang: Int = 0,
    @Json(name = "top_model") val topModel: String? = null,
    @Json(name = "target_harian") val targetHarian: Int = 500
)

@JsonClass(generateAdapter = true)
data class PayrollPeriod(
    @Json(name = "id") val id: String = "",
    @Json(name = "label") val label: String = "",
    @Json(name = "start_date") val startDate: String = "",
    @Json(name = "end_date") val endDate: String = "",
    @Json(name = "status") val status: String = "Aktif"
)

@JsonClass(generateAdapter = true)
data class PayrollModelSummary(
    @Json(name = "model_id") val modelId: String = "",
    @Json(name = "nama_model") val namaModel: String = "",
    @Json(name = "total_pasang") val totalPasang: Int = 0,
    @Json(name = "ongkos_satuan") val ongkosSatuan: Double = 0.0,
    @Json(name = "subtotal_upah") val subtotalUpah: Double = 0.0
)

@JsonClass(generateAdapter = true)
data class PayrollWorkerRecap(
    @Json(name = "pekerja_id") val pekerjaId: String = "",
    @Json(name = "pekerja_nama") val pekerjaNama: String = "",
    @Json(name = "nik") val nik: String = "",
    @Json(name = "bagian") val bagian: String = "Assembling",
    @Json(name = "total_pasang") val totalPasang: Int = 0,
    @Json(name = "total_upah") val totalUpah: Double = 0.0,
    @Json(name = "hari_kerja") val hariKerja: Int = 0,
    @Json(name = "rincian_model") val rincianModel: List<PayrollModelSummary> = emptyList()
)

@JsonClass(generateAdapter = true)
data class ApiResponse<T>(
    @Json(name = "success") val success: Boolean = true,
    @Json(name = "message") val message: String? = null,
    @Json(name = "data") val data: T? = null
)
