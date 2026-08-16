package com.example

import com.example.data.models.BatchDraftItem
import com.example.data.models.ModelSepatu
import com.example.data.models.ProduksiEntry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ExampleUnitTest {

    @Test
    fun batchDraftItem_calculatesTotalsCorrectly() {
        val model = ModelSepatu(
            id = "m1",
            kodeModel = "SNK-01",
            namaModel = "Sneaker Sport",
            ongkosPerPasang = 4500.0
        )
        val sizes = mapOf(
            "38" to 10,
            "39" to 15,
            "40" to 20,
            "41" to 15
        )
        val draft = BatchDraftItem(
            model = model,
            nomorPo = "PO-2026-001",
            sizes = sizes,
            shift = 1
        )

        assertEquals(60, draft.totalPasang)
        assertEquals(270000.0, draft.totalUpah, 0.001)
        assertEquals("38:10,39:15,40:20,41:15", draft.toSizesJson())
    }

    @Test
    fun produksiEntry_decodesSizesCorrectly() {
        val entry = ProduksiEntry(
            id = "e1",
            tanggal = "2026-08-15",
            pekerjaId = "w1",
            pekerjaNama = "Budi Santoso",
            shift = 1,
            nomorPo = "PO-2026-001",
            modelId = "m1",
            namaModel = "Sneaker Sport",
            ongkosSatuan = 4500.0,
            sizesJson = "36:5,37:8,38:12",
            totalPasang = 25,
            estimasiUpah = 112500.0
        )

        val map = entry.sizes
        assertEquals(3, map.size)
        assertEquals(5, map["36"])
        assertEquals(8, map["37"])
        assertEquals(12, map["38"])
    }
}
