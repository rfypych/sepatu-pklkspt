package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.models.ProduksiEntry
import com.example.data.models.SizeBreakdown
import com.example.ui.theme.*
import java.text.NumberFormat
import java.util.Locale

// Utility Formatters
fun formatRupiah(amount: Double): String {
    val format = NumberFormat.getCurrencyInstance(Locale("in", "ID"))
    format.maximumFractionDigits = 0
    return format.format(amount).replace("Rp", "Rp ")
}

fun formatNumber(number: Int): String {
    return NumberFormat.getNumberInstance(Locale("in", "ID")).format(number)
}

// Reusable Shift Badge (Shift 1 Kuning/Amber vs Shift 2 Biru/Indigo)
@Composable
fun ShiftBadge(
    shift: Int,
    modifier: Modifier = Modifier
) {
    val isShift1 = shift == 1
    val bgColor = if (isShift1) Amber100 else Indigo100
    val textColor = if (isShift1) Amber700 else Indigo700
    val borderColor = if (isShift1) Amber500 else Indigo600
    val label = if (isShift1) "Shift 1 (Pagi)" else "Shift 2 (Malam)"
    val icon = if (isShift1) Icons.Default.WbSunny else Icons.Default.Nightlight

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(8.dp),
        border = androidx.compose.foundation.BorderStroke(1.5.dp, borderColor),
        modifier = modifier
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = textColor,
                modifier = Modifier.size(14.dp)
            )
            Text(
                text = label,
                color = textColor,
                fontSize = 12.sp,
                fontWeight = FontWeight.ExtraBold
            )
        }
    }
}

// Reusable PO Badge
@Composable
fun POBadge(
    nomorPo: String,
    modifier: Modifier = Modifier
) {
    Surface(
        color = Blue100,
        shape = RoundedCornerShape(8.dp),
        border = androidx.compose.foundation.BorderStroke(1.5.dp, Blue600),
        modifier = modifier
    ) {
        Text(
            text = "PO: $nomorPo",
            color = Blue700,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

// Reusable Status Badge
@Composable
fun StatusBadge(
    status: String,
    modifier: Modifier = Modifier
) {
    val isDone = status.equals("Selesai", ignoreCase = true)
    val bgColor = if (isDone) Emerald100 else Amber100
    val textColor = if (isDone) Emerald700 else Amber700
    val borderColor = if (isDone) Emerald600 else Amber500

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(8.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor),
        modifier = modifier
    ) {
        Text(
            text = status,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        )
    }
}

// Metric Card with thick border and large high-contrast typography
@Composable
fun MetricCard(
    title: String,
    value: String,
    subtitle: String? = null,
    icon: ImageVector? = null,
    accentColor: Color = Emerald600,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(2.dp, Slate200),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title.uppercase(),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate500,
                    letterSpacing = 0.5.sp
                )
                if (icon != null) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(accentColor.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = accentColor,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = value,
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
                color = Slate900,
                letterSpacing = (-0.5).sp
            )

            if (subtitle != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = Slate500
                )
            }
        }
    }
}

// Matriks Input Ukuran Sepatu 36 - 44
// Tombol Jempol Minimum 48px Touch Target, Border Tebal 2px
@Composable
fun SizeGridInput(
    sizeMap: Map<String, Int>,
    onSizeChanged: (String, Int) -> Unit,
    modifier: Modifier = Modifier
) {
    val sizes = listOf("36", "37", "38", "39", "40", "41", "42", "43", "44")
    val totalPairs = sizeMap.values.sumOf { it }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(2.dp, Slate200),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            // Header Matriks
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "MATRIKS UKURAN SEPATU",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Slate700
                    )
                    Text(
                        text = "Ukuran 36 s/d 44",
                        fontSize = 11.sp,
                        color = Slate500
                    )
                }

                Surface(
                    color = if (totalPairs > 0) Emerald100 else Slate100,
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(
                        1.5.dp,
                        if (totalPairs > 0) Emerald600 else Slate200
                    )
                ) {
                    Text(
                        text = "Total: $totalPairs Pasang",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        color = if (totalPairs > 0) Emerald700 else Slate700,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 3 items per row (3x3 grid)
            for (i in sizes.indices step 3) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    for (j in 0 until 3) {
                        if (i + j < sizes.size) {
                            val sz = sizes[i + j]
                            val qty = sizeMap[sz] ?: 0
                            SizeInputCell(
                                sizeLabel = sz,
                                quantity = qty,
                                onQuantityChanged = { newQ -> onSizeChanged(sz, newQ) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SizeInputCell(
    sizeLabel: String,
    quantity: Int,
    onQuantityChanged: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    val focusManager = LocalFocusManager.current
    var textValue by remember(quantity) { mutableStateOf(if (quantity > 0) quantity.toString() else "") }

    val hasValue = quantity > 0
    val borderColor = if (hasValue) Emerald600 else Slate200
    val bgColor = if (hasValue) Emerald50 else Color.White

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(bgColor)
            .border(2.dp, borderColor, RoundedCornerShape(10.dp))
            .padding(6.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Label Ukuran
        Text(
            text = "Sz $sizeLabel",
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = if (hasValue) Emerald700 else Slate700
        )

        Spacer(modifier = Modifier.height(4.dp))

        // Controls: Minus Button, Input, Plus Button
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Minus Button (48dp accessible touch target)
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(if (quantity > 0) Slate200 else Slate100)
                    .clickable(enabled = quantity > 0) {
                        onQuantityChanged((quantity - 1).coerceAtLeast(0))
                    }
                    .testTag("btn_minus_sz_$sizeLabel"),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Remove,
                    contentDescription = "Kurangi Size $sizeLabel",
                    tint = if (quantity > 0) Slate800 else Slate500,
                    modifier = Modifier.size(16.dp)
                )
            }

            // Quantity Display / Direct Input Box
            Box(
                modifier = Modifier
                    .width(44.dp)
                    .height(34.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(if (hasValue) Color.White else Slate100)
                    .border(1.dp, if (hasValue) Emerald600 else Color.Transparent, RoundedCornerShape(6.dp)),
                contentAlignment = Alignment.Center
            ) {
                BasicTextField(
                    value = textValue,
                    onValueChange = { input ->
                        val filtered = input.filter { it.isDigit() }
                        textValue = filtered
                        val num = filtered.toIntOrNull() ?: 0
                        onQuantityChanged(num.coerceIn(0, 9999))
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_sz_$sizeLabel"),
                    textStyle = TextStyle(
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 14.sp,
                        color = if (hasValue) Emerald700 else Slate900
                    ),
                    singleLine = true,
                    cursorBrush = SolidColor(Emerald600),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Number,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() }),
                    decorationBox = { innerTextField ->
                        if (textValue.isEmpty()) {
                            Text(
                                "0",
                                textAlign = TextAlign.Center,
                                modifier = Modifier.fillMaxWidth(),
                                color = Slate500,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        innerTextField()
                    }
                )
            }

            // Plus Button (48dp touch area)
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(Emerald600)
                    .clickable {
                        onQuantityChanged(quantity + 1)
                    }
                    .testTag("btn_plus_sz_$sizeLabel"),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Tambah Size $sizeLabel",
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

// Chips row displaying the size breakdowns
@Composable
fun SizeChipsRow(
    sizes: SizeBreakdown,
    modifier: Modifier = Modifier
) {
    SizeChipsRow(sizes = sizes.toMap(), modifier = modifier)
}

@Composable
fun SizeChipsRow(
    sizes: Map<String, Int>,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    val activeSizes = sizes.filter { it.value > 0 }.entries.sortedBy { it.key.toIntOrNull() ?: 0 }

    if (activeSizes.isEmpty()) {
        Text("Ukuran: -", fontSize = 12.sp, color = Slate500)
        return
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(scrollState),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        activeSizes.forEach { entry ->
            Surface(
                color = Slate100,
                shape = RoundedCornerShape(6.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Slate300)
            ) {
                Text(
                    text = "Sz ${entry.key}: ${entry.value}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate700,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }
    }
}

// Dialog: Tambah PO Cepat
@Composable
fun AddPoDialog(
    onDismiss: () -> Unit,
    onConfirm: (noPo: String, namaPo: String, target: Int) -> Unit
) {
    var nomorPo by remember { mutableStateOf("") }
    var namaPo by remember { mutableStateOf("") }
    var targetStr by remember { mutableStateOf("") }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "TAMBAH PO BARU",
                fontWeight = FontWeight.Black,
                fontSize = 18.sp,
                color = Slate900
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = nomorPo,
                    onValueChange = { nomorPo = it },
                    label = { Text("Nomor PO (e.g. PO-2026-005)") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_new_po_number")
                )

                OutlinedTextField(
                    value = namaPo,
                    onValueChange = { namaPo = it },
                    label = { Text("Nama PO / Buyer / Keterangan") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_new_po_name")
                )

                OutlinedTextField(
                    value = targetStr,
                    onValueChange = { targetStr = it.filter { ch -> ch.isDigit() } },
                    label = { Text("Target Pasang") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_new_po_target")
                )

                if (errorMsg != null) {
                    Text(
                        text = errorMsg ?: "",
                        color = Red600,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (nomorPo.isBlank() || namaPo.isBlank()) {
                        errorMsg = "Nomor PO dan Nama PO wajib diisi."
                        return@Button
                    }
                    val target = targetStr.toIntOrNull() ?: 0
                    if (target <= 0) {
                        errorMsg = "Target pasang harus lebih besar dari 0."
                        return@Button
                    }
                    onConfirm(nomorPo.trim(), namaPo.trim(), target)
                },
                colors = ButtonDefaults.buttonColors(containerColor = Blue600)
            ) {
                Text("Simpan PO", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal")
            }
        }
    )
}

// Dialog: Edit Produksi Hari Ini
@Composable
fun EditProduksiDialog(
    entry: ProduksiEntry,
    onDismiss: () -> Unit,
    onSave: (ProduksiEntry) -> Unit
) {
    var sizeMap by remember { mutableStateOf(entry.sizes.toMap()) }
    val totalPairs = sizeMap.values.sumOf { it }
    val estimasiUpah = totalPairs * entry.ongkosSatuan

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text("EDIT PRODUKSI", fontWeight = FontWeight.Black, fontSize = 17.sp)
                Text(
                    text = "${entry.pekerjaNama} • ${entry.namaModel}",
                    fontSize = 13.sp,
                    color = Slate600
                )
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                SizeGridInput(
                    sizeMap = sizeMap,
                    onSizeChanged = { sz, qty ->
                        val updated = HashMap(sizeMap)
                        updated[sz] = qty
                        sizeMap = updated
                    }
                )

                Surface(
                    color = Emerald50,
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Emerald600),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Estimasi Upah Baru:", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Emerald800)
                        Text(formatRupiah(estimasiUpah), fontWeight = FontWeight.Black, fontSize = 14.sp, color = Emerald700)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val sizesJsonStr = sizeMap.entries
                        .filter { it.value > 0 }
                        .joinToString(",") { "${it.key}:${it.value}" }

                    val updatedEntry = entry.copy(
                        sizes = com.example.data.models.SizeBreakdown.fromMap(sizeMap),
                        sizesJson = sizesJsonStr,
                        totalPasang = totalPairs,
                        estimasiUpah = estimasiUpah
                    )
                    onSave(updatedEntry)
                },
                colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                enabled = totalPairs > 0
            ) {
                Text("Simpan Perubahan", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Batal") }
        }
    )
}

// -------------------------------------------------------------
// EXPORT RIWAYAT TO EXCEL / CSV
// -------------------------------------------------------------
fun exportRiwayatToExcel(
    context: android.content.Context,
    items: List<ProduksiEntry>,
    filterType: String
) {
    try {
        val fileName = "Laporan_Produksi_${filterType}_${System.currentTimeMillis()}.csv"
        val header = "Pekerja,Tanggal,Shift,Model,No PO,36,37,38,39,40,41,42,43,44,Total Pasang,Ongkos Satuan,Subtotal Upah\n"
        val rows = items.joinToString("\n") { it ->
            val s = it.sizes
            "\"${it.pekerjaNama}\",${it.tanggal},Shift ${it.shift},\"${it.namaModel}\",\"${it.nomorPo}\",${s.s36},${s.s37},${s.s38},${s.s39},${s.s40},${s.s41},${s.s42},${s.s43},${s.s44},${it.totalPasang},${it.ongkosSatuan.toLong()},${it.estimasiUpah.toLong()}"
        }
        val csvContent = "\uFEFF" + header + rows

        val sendIntent = android.content.Intent().apply {
            action = android.content.Intent.ACTION_SEND
            putExtra(android.content.Intent.EXTRA_TEXT, csvContent)
            putExtra(android.content.Intent.EXTRA_SUBJECT, fileName)
            putExtra(android.content.Intent.EXTRA_TITLE, "Ekspor Laporan Produksi ($filterType)")
            type = "text/csv"
        }
        val shareIntent = android.content.Intent.createChooser(sendIntent, "Simpan / Bagikan Laporan Excel (XLSX / CSV)")
        shareIntent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(shareIntent)
    } catch (e: Exception) {
        android.widget.Toast.makeText(context, "Gagal ekspor: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
    }
}

