package com.example.data.api

import com.example.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): Response<LoginResponse>

    @POST("auth/switch")
    suspend fun switchRole(@Body body: Map<String, String>): Response<LoginResponse>

    // Pekerja
    @GET("pekerja")
    suspend fun getPekerja(
        @Query("aktif") aktif: Boolean? = null
    ): Response<List<Pekerja>>

    @POST("pekerja")
    suspend fun createPekerja(@Body pekerja: Pekerja): Response<Pekerja>

    @PUT("pekerja/{id}")
    suspend fun updatePekerja(@Path("id") id: String, @Body pekerja: Pekerja): Response<Pekerja>

    @DELETE("pekerja/{id}")
    suspend fun deletePekerja(@Path("id") id: String): Response<Map<String, Any>>

    // PO
    @GET("po")
    suspend fun getPO(): Response<List<ProductionOrder>>

    @POST("po")
    suspend fun createPO(@Body po: ProductionOrder): Response<ProductionOrder>

    @PUT("po/{id}")
    suspend fun updatePO(@Path("id") id: String, @Body po: ProductionOrder): Response<ProductionOrder>

    @DELETE("po/{id}")
    suspend fun deletePO(@Path("id") id: String): Response<Map<String, Any>>

    // Model & Ongkos
    @GET("model")
    suspend fun getModel(): Response<List<ModelSepatu>>

    @POST("model")
    suspend fun createModel(@Body model: ModelSepatu): Response<ModelSepatu>

    @PUT("model/{id}")
    suspend fun updateModel(@Path("id") id: String, @Body model: ModelSepatu): Response<ModelSepatu>

    @DELETE("model/{id}")
    suspend fun deleteModel(@Path("id") id: String): Response<Map<String, Any>>

    // Produksi
    @GET("produksi/hari-ini")
    suspend fun getProduksiHariIni(): Response<List<ProduksiEntry>>

    @GET("produksi")
    suspend fun getProduksi(
        @Query("tanggal") tanggal: String? = null,
        @Query("pekerja_id") pekerjaId: String? = null,
        @Query("po_id") poId: String? = null,
        @Query("bulan") bulan: String? = null,
        @Query("tahun") tahun: String? = null
    ): Response<List<ProduksiEntry>>

    @POST("produksi/batch")
    suspend fun submitBatchProduksi(@Body request: BatchProduksiRequest): Response<List<ProduksiEntry>>

    @POST("produksi")
    suspend fun createProduksi(@Body entry: ProduksiEntry): Response<ProduksiEntry>

    @PUT("produksi/{id}")
    suspend fun updateProduksi(@Path("id") id: String, @Body entry: ProduksiEntry): Response<ProduksiEntry>

    @DELETE("produksi/{id}")
    suspend fun deleteProduksi(@Path("id") id: String): Response<Map<String, Any>>

    // Dashboard
    @GET("dashboard/today")
    suspend fun getDashboardToday(): Response<DashboardTodayResponse>

    // Payroll
    @GET("payroll/periods")
    suspend fun getPayrollPeriods(): Response<List<PayrollPeriod>>

    @GET("payroll/rekap")
    suspend fun getPayrollRekap(
        @Query("periode") periodeId: String? = null,
        @Query("start_date") startDate: String? = null,
        @Query("end_date") endDate: String? = null
    ): Response<List<PayrollWorkerRecap>>
}
