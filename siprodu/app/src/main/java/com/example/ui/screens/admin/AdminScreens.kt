package com.example.ui.screens.admin

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.models.*
import com.example.ui.components.*
import com.example.ui.theme.*
import com.example.ui.viewmodels.AdminViewModel
import com.example.ui.viewmodels.AuthViewModel
import com.example.ui.viewmodels.WorkerWageSummary

@Composable
fun AdminMainScreen(
    authViewModel: AuthViewModel,
    adminViewModel: AdminViewModel,
    modifier: Modifier = Modifier
) {
    var selectedTab by remember { mutableIntStateOf(0) }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        bottomBar = {
            Column(modifier = Modifier.fillMaxWidth()) {
                HorizontalDivider(thickness = 1.dp, color = Slate200)
                NavigationBar(
                    containerColor = Color.White,
                    tonalElevation = 0.dp,
                    windowInsets = WindowInsets.navigationBars
                ) {
                    NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard") },
                    label = { Text("Dashboard", fontWeight = FontWeight.Bold) },
                    modifier = Modifier.testTag("tab_admin_dashboard"),
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Emerald700,
                        selectedTextColor = Emerald800,
                        indicatorColor = Emerald100,
                        unselectedIconColor = Slate600,
                        unselectedTextColor = Slate600
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.ReceiptLong, contentDescription = "Rekap Upah") },
                    label = { Text("Rekap Upah", fontWeight = FontWeight.Bold) },
                    modifier = Modifier.testTag("tab_admin_rekap"),
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Blue700,
                        selectedTextColor = Blue800,
                        indicatorColor = Blue100,
                        unselectedIconColor = Slate600,
                        unselectedTextColor = Slate600
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.FolderShared, contentDescription = "Master Data") },
                    label = { Text("Master Data", fontWeight = FontWeight.Bold) },
                    modifier = Modifier.testTag("tab_admin_master"),
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Indigo700,
                        selectedTextColor = Indigo800,
                        indicatorColor = Indigo100,
                        unselectedIconColor = Slate600,
                        unselectedTextColor = Slate600
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Sistem") },
                    label = { Text("Sistem", fontWeight = FontWeight.Bold) },
                    modifier = Modifier.testTag("tab_admin_sistem"),
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Slate800,
                        selectedTextColor = Slate900,
                        indicatorColor = Slate200,
                        unselectedIconColor = Slate600,
                        unselectedTextColor = Slate600
                    )
                )
            }
        }
    }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = innerPadding.calculateBottomPadding())
        ) {
            when (selectedTab) {
                0 -> AdminDashboardTab(adminViewModel)
                1 -> AdminRekapitulasiTab(adminViewModel)
                2 -> AdminMasterDataTab(adminViewModel)
                3 -> AdminSistemTab(authViewModel, adminViewModel)
            }
        }
    }
}

// -------------------------------------------------------------
// TAB 1: EXECUTIVE DASHBOARD
// -------------------------------------------------------------
@Composable
fun AdminDashboardTab(viewModel: AdminViewModel) {
    val state by viewModel.dashboardState.collectAsState()
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate100)
            .verticalScroll(scrollState)
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Top Header
        Surface(
            color = Color.White,
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(2.dp, Slate200),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "EXECUTIVE DASHBOARD",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Black,
                        color = Slate900
                    )
                    Text(
                        text = "SIPRODU • Monitor Produksi & Finansial",
                        fontSize = 12.sp,
                        color = Slate500
                    )
                }

                Surface(
                    color = Emerald100,
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Emerald600)
                ) {
                    Text(
                        text = "LIVE",
                        color = Emerald700,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
        }

        // Key Metrics: Today vs This Month
        Text(
            text = "PRODUKSI HARI INI",
            fontSize = 12.sp,
            fontWeight = FontWeight.ExtraBold,
            color = Slate700
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MetricCard(
                title = "Total Pasang Hari Ini",
                value = "${formatNumber(state.todayPairs)} psg",
                subtitle = "Semua shift",
                icon = Icons.Default.Inventory2,
                accentColor = Blue600,
                modifier = Modifier.weight(1f)
            )

            MetricCard(
                title = "Upah Hari Ini",
                value = formatRupiah(state.todayWages),
                subtitle = "Total upah",
                icon = Icons.Default.Payments,
                accentColor = Emerald600,
                modifier = Modifier.weight(1f)
            )
        }

        Text(
            text = "AKUMULASI BULAN BERJALAN",
            fontSize = 12.sp,
            fontWeight = FontWeight.ExtraBold,
            color = Slate700
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MetricCard(
                title = "Total Pasang Bulan Ini",
                value = "${formatNumber(state.monthPairs)} psg",
                subtitle = "Bulan ${viewModel.repository.getCurrentMonthPrefix()}",
                icon = Icons.Default.TrendingUp,
                accentColor = Indigo600,
                modifier = Modifier.weight(1f)
            )

            MetricCard(
                title = "Total Upah Bulan Ini",
                value = formatRupiah(state.monthWages),
                subtitle = "Siap dibayarkan",
                icon = Icons.Default.AccountBalanceWallet,
                accentColor = Amber600,
                modifier = Modifier.weight(1f)
            )
        }

        // Production Order Progress
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "PROGRESS PRODUCTION ORDER (PO)",
                fontSize = 12.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Slate700
            )
            Text(
                text = "${state.activePOCount} Aktif",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Blue700
            )
        }

        if (state.poProgressList.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Belum ada data PO", color = Slate500)
            }
        } else {
            state.poProgressList.forEach { summary ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(2.dp, Slate200),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = summary.po.nomorPo,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 15.sp,
                                    color = Slate900
                                )
                                Text(
                                    text = summary.po.namaPo,
                                    fontSize = 12.sp,
                                    color = Slate600
                                )
                            }
                            StatusBadge(status = summary.po.status)
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Progress Bar
                        LinearProgressIndicator(
                            progress = { summary.percentage },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(10.dp)
                                .clip(RoundedCornerShape(5.dp)),
                            color = if (summary.percentage >= 1f) Emerald600 else Blue600,
                            trackColor = Slate200
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Selesai: ${formatNumber(summary.totalProduced)} / ${formatNumber(summary.po.targetPasang)} psg",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate700
                            )
                            Text(
                                text = "${(summary.percentage * 100).toInt()}%",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black,
                                color = if (summary.percentage >= 1f) Emerald700 else Blue700
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

// -------------------------------------------------------------
// TAB 2: REKAPITULASI UPAH & SLIP GAJI
// -------------------------------------------------------------
@Composable
fun AdminRekapitulasiTab(viewModel: AdminViewModel) {
    val state by viewModel.dashboardState.collectAsState()
    val context = LocalContext.current
    var selectedSummaryForSlip by remember { mutableStateOf<WorkerWageSummary?>(null) }

    if (selectedSummaryForSlip != null) {
        SlipGajiDialog(
            summary = selectedSummaryForSlip!!,
            period = state.selectedPeriod,
            onDismiss = { selectedSummaryForSlip = null },
            onCopyWhatsApp = { text ->
                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                val clip = ClipData.newPlainText("Slip Upah", text)
                clipboard.setPrimaryClip(clip)
                Toast.makeText(context, "Slip upah berhasil disalin! Siap dikirim via WhatsApp.", Toast.LENGTH_SHORT).show()
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate100)
    ) {
        // Header & Period Filter
        Surface(
            color = Color.White,
            shadowElevation = 2.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "REKAPITULASI UPAH KERJA",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Black,
                    color = Slate900
                )
                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("Hari Ini", "Bulan Ini", "Tahun Ini", "Semua").forEach { period ->
                        val isSelected = state.selectedPeriod == period
                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .height(38.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { viewModel.setPeriod(period) }
                                .testTag("admin_period_$period"),
                            color = if (isSelected) Emerald700 else Slate100,
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isSelected) Emerald800 else Slate200
                            )
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = period,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = if (isSelected) Color.White else Slate700
                                )
                            }
                        }
                    }
                }
            }
        }

        // Summary Total for Selected Period
        val totalPasangPeriod = state.workerSummaries.sumOf { it.totalPasang }
        val totalUpahPeriod = state.workerSummaries.sumOf { it.totalUpah }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MetricCard(
                title = "Total Pasang (${state.selectedPeriod})",
                value = "${formatNumber(totalPasangPeriod)} psg",
                icon = Icons.Default.Inventory2,
                accentColor = Blue600,
                modifier = Modifier.weight(1f)
            )

            MetricCard(
                title = "Total Upah (${state.selectedPeriod})",
                value = formatRupiah(totalUpahPeriod),
                icon = Icons.Default.Payments,
                accentColor = Emerald600,
                modifier = Modifier.weight(1f)
            )
        }

        // List of Worker Summaries
        if (state.workerSummaries.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Tidak ada data pekerja untuk periode ini.", color = Slate500)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(state.workerSummaries) { summary ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("card_wage_worker_${summary.pekerja.id}"),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = androidx.compose.foundation.BorderStroke(2.dp, Slate200),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = summary.pekerja.nama,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Slate900
                                    )
                                    Text(
                                        text = "${summary.pekerja.nik} • Bagian ${summary.pekerja.bagian}",
                                        fontSize = 12.sp,
                                        color = Slate500
                                    )
                                }

                                ShiftBadge(shift = summary.pekerja.shift)
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Slate50, RoundedCornerShape(8.dp))
                                    .padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Produksi Pasang", fontSize = 11.sp, color = Slate500, fontWeight = FontWeight.Bold)
                                    Text("${formatNumber(summary.totalPasang)} Pasang", fontSize = 14.sp, fontWeight = FontWeight.Black, color = Blue700)
                                }

                                Column(horizontalAlignment = Alignment.End) {
                                    Text("Total Upah Kerja", fontSize = 11.sp, color = Slate500, fontWeight = FontWeight.Bold)
                                    Text(formatRupiah(summary.totalUpah), fontSize = 15.sp, fontWeight = FontWeight.Black, color = Emerald700)
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Button(
                                onClick = { selectedSummaryForSlip = summary },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(42.dp)
                                    .testTag("btn_slip_${summary.pekerja.id}"),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Slate900, contentColor = Color.White)
                            ) {
                                Icon(Icons.Default.Receipt, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Cetak / Lihat Rincian Slip Upah", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// TAB 3: MASTER DATA MANAGEMENT (PEKERJA, MODEL, PO)
// -------------------------------------------------------------
@Composable
fun AdminMasterDataTab(viewModel: AdminViewModel) {
    val state by viewModel.dashboardState.collectAsState()
    val workers by viewModel.allWorkers.collectAsState()
    val models by viewModel.allModels.collectAsState()
    val pos by viewModel.allPOs.collectAsState()

    var selectedSubSection by remember { mutableStateOf("Pekerja") } // "Pekerja", "Model Sepatu", "Production Order"

    var showAddWorkerDialog by remember { mutableStateOf(false) }
    var showAddModelDialog by remember { mutableStateOf(false) }
    var showAddPODialog by remember { mutableStateOf(false) }

    var editingWorker by remember { mutableStateOf<Pekerja?>(null) }
    var editingModel by remember { mutableStateOf<ModelSepatu?>(null) }
    var editingPO by remember { mutableStateOf<ProductionOrder?>(null) }

    // Dialogs
    if (showAddWorkerDialog) {
        AddEditWorkerDialog(
            worker = null,
            onDismiss = { showAddWorkerDialog = false },
            onSave = { nama, shift ->
                viewModel.addWorker(nama, shift)
                showAddWorkerDialog = false
            }
        )
    }

    if (editingWorker != null) {
        AddEditWorkerDialog(
            worker = editingWorker,
            onDismiss = { editingWorker = null },
            onSave = { nama, shift ->
                viewModel.updateWorker(editingWorker!!.copy(nama = nama, shift = shift))
                editingWorker = null
            }
        )
    }

    if (showAddModelDialog) {
        AddEditModelDialog(
            model = null,
            onDismiss = { showAddModelDialog = false },
            onSave = { kode, nama, kat, ongkos, desc ->
                viewModel.addModel(kode, nama, kat, ongkos, desc)
                showAddModelDialog = false
            }
        )
    }

    if (editingModel != null) {
        AddEditModelDialog(
            model = editingModel,
            onDismiss = { editingModel = null },
            onSave = { kode, nama, kat, ongkos, desc ->
                viewModel.updateModel(editingModel!!.copy(kodeModel = kode, namaModel = nama, kategori = kat, ongkosPerPasang = ongkos, deskripsi = desc))
                editingModel = null
            }
        )
    }

    if (showAddPODialog) {
        AddEditPODialog(
            po = null,
            onDismiss = { showAddPODialog = false },
            onSave = { no, nama, target, status, note ->
                viewModel.addPO(no, nama, target, status, note)
                showAddPODialog = false
            }
        )
    }

    if (editingPO != null) {
        AddEditPODialog(
            po = editingPO,
            onDismiss = { editingPO = null },
            onSave = { no, nama, target, status, note ->
                viewModel.updatePO(editingPO!!.copy(nomorPo = no, namaPo = nama, targetPasang = target, status = status, catatan = note))
                editingPO = null
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate100)
    ) {
        // Master Sub-Tab selector
        Surface(
            color = Color.White,
            shadowElevation = 2.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "MANAJEMEN MASTER DATA",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Black,
                    color = Slate900
                )
                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("Pekerja", "Model Sepatu", "Production Order").forEach { tab ->
                        val isSelected = selectedSubSection == tab
                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .height(38.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { selectedSubSection = tab }
                                .testTag("master_tab_$tab"),
                            color = if (isSelected) Indigo700 else Slate100,
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isSelected) Indigo900 else Slate200
                            )
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = tab,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = if (isSelected) Color.White else Slate700
                                )
                            }
                        }
                    }
                }
            }
        }

        // Feedback
        if (state.feedbackMsg != null) {
            Surface(
                color = Emerald100,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    modifier = Modifier.padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = state.feedbackMsg ?: "",
                        color = Emerald700,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier.weight(1f)
                    )
                    IconButton(onClick = { viewModel.clearFeedback() }, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Tutup", tint = Emerald700, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }

        // Sub Section Content
        when (selectedSubSection) {
            "Pekerja" -> {
                Box(modifier = Modifier.fillMaxSize()) {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        item {
                            Button(
                                onClick = { showAddWorkerDialog = true },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                                    .testTag("btn_add_worker"),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Indigo700)
                            ) {
                                Icon(Icons.Default.PersonAdd, contentDescription = null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("+ Tambah Pekerja Baru", fontWeight = FontWeight.Bold)
                            }
                        }

                        items(workers) { worker ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                border = androidx.compose.foundation.BorderStroke(2.dp, Slate200)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(worker.nama, fontWeight = FontWeight.Black, fontSize = 15.sp, color = Slate900)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            ShiftBadge(shift = worker.shift)
                                            StatusBadge(status = if (worker.aktif) "Aktif" else "Nonaktif")
                                        }
                                    }

                                    Row {
                                        IconButton(onClick = { editingWorker = worker }) {
                                            Icon(Icons.Default.Edit, contentDescription = "Edit", tint = Blue600)
                                        }
                                        IconButton(onClick = { viewModel.toggleWorkerStatus(worker) }) {
                                            Icon(
                                                if (worker.aktif) Icons.Default.ToggleOn else Icons.Default.ToggleOff,
                                                contentDescription = "Toggle Status",
                                                tint = if (worker.aktif) Emerald600 else Slate400,
                                                modifier = Modifier.size(32.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            "Model Sepatu" -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        Button(
                            onClick = { showAddModelDialog = true },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .testTag("btn_add_model"),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Indigo700)
                        ) {
                            Icon(Icons.Default.AddBox, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("+ Tambah Model Sepatu & Ongkos", fontWeight = FontWeight.Bold)
                        }
                    }

                    items(models) { model ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = androidx.compose.foundation.BorderStroke(2.dp, Slate200)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(model.namaModel, fontWeight = FontWeight.Black, fontSize = 15.sp, color = Slate900)
                                    Text("Kode: ${model.kodeModel} • Kategori: ${model.kategori}", fontSize = 12.sp, color = Slate500)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Ongkos Kerja: ${formatRupiah(model.ongkosPerPasang)} / psg",
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 13.sp,
                                        color = Emerald700
                                    )
                                }

                                Row {
                                    IconButton(onClick = { editingModel = model }) {
                                        Icon(Icons.Default.Edit, contentDescription = "Edit", tint = Blue600)
                                    }
                                    IconButton(onClick = { viewModel.deleteModel(model.id) }) {
                                        Icon(Icons.Default.DeleteOutline, contentDescription = "Hapus", tint = Red600)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            "Production Order" -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        Button(
                            onClick = { showAddPODialog = true },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .testTag("btn_add_po_master"),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Indigo700)
                        ) {
                            Icon(Icons.Default.PlaylistAdd, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("+ Tambah Production Order (PO)", fontWeight = FontWeight.Bold)
                        }
                    }

                    items(pos) { po ->
                        var showDeleteConfirm by remember { mutableStateOf(false) }
                        if (showDeleteConfirm) {
                            AlertDialog(
                                onDismissRequest = { showDeleteConfirm = false },
                                title = { Text("Hapus PO?", fontWeight = FontWeight.Black) },
                                text = { Text("PO \"${po.nomorPo}\" akan dihapus permanen. Lanjutkan?") },
                                confirmButton = {
                                    Button(
                                        onClick = {
                                            viewModel.deletePO(po.id)
                                            showDeleteConfirm = false
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = Red600)
                                    ) { Text("Ya, Hapus") }
                                },
                                dismissButton = {
                                    TextButton(onClick = { showDeleteConfirm = false }) { Text("Batal") }
                                }
                            )
                        }
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = androidx.compose.foundation.BorderStroke(2.dp, Slate200)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Text(po.nomorPo, fontWeight = FontWeight.Black, fontSize = 15.sp, color = Slate900)
                                        StatusBadge(status = po.status)
                                    }
                                    Text(po.namaPo, fontSize = 12.sp, color = Slate600)
                                    Text("Target: ${formatNumber(po.targetPasang)} pasang • Mulai: ${po.tanggalMulai}", fontSize = 12.sp, color = Slate500)
                                }

                                Row {
                                    IconButton(onClick = { viewModel.togglePOStatus(po) }) {
                                        Icon(
                                            if (po.status == "Selesai") Icons.Default.CheckCircle else Icons.Default.Timelapse,
                                            contentDescription = "Status",
                                            tint = if (po.status == "Selesai") Emerald600 else Amber600
                                        )
                                    }
                                    IconButton(onClick = { editingPO = po }) {
                                        Icon(Icons.Default.Edit, contentDescription = "Edit", tint = Blue600)
                                    }
                                    IconButton(onClick = { showDeleteConfirm = true }) {
                                        Icon(Icons.Default.Delete, contentDescription = "Hapus", tint = Red600)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// TAB 4: SISTEM & SWITCH ROLE
// -------------------------------------------------------------
@Composable
fun AdminSistemTab(
    authViewModel: AuthViewModel,
    adminViewModel: AdminViewModel
) {
    val scrollState = rememberScrollState()
    var showResetConfirm by remember { mutableStateOf(false) }

    if (showResetConfirm) {
        AlertDialog(
            onDismissRequest = { showResetConfirm = false },
            title = { Text("Reset ke Data Default Pabrik?", fontWeight = FontWeight.Bold) },
            text = { Text("Seluruh data produksi, pekerja, dan model akan di-reset ke sample pabrik awal.") },
            confirmButton = {
                Button(
                    onClick = {
                        adminViewModel.resetData()
                        showResetConfirm = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Red600)
                ) {
                    Text("Ya, Reset Data")
                }
            },
            dismissButton = {
                TextButton(onClick = { showResetConfirm = false }) { Text("Batal") }
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate100)
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = "PENGATURAN SISTEM & DATABASE",
            fontSize = 18.sp,
            fontWeight = FontWeight.Black,
            color = Slate900
        )

        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(2.dp, Slate200)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Tentang Sistem Produksi Pabrik", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Aplikasi ini menyimpan seluruh pencatatan produksi dan kalkulasi upah borongan secara offline-first dengan Room Database.",
                    fontSize = 13.sp,
                    color = Slate600
                )
            }
        }

        Button(
            onClick = { showResetConfirm = true },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Red50, contentColor = Red600),
            border = androidx.compose.foundation.BorderStroke(1.5.dp, Red600)
        ) {
            Icon(Icons.Default.Restore, contentDescription = null, tint = Red600)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Muat Ulang / Reset Data Sample Pabrik", fontWeight = FontWeight.Bold, color = Red600)
        }

        Text(
            text = "KEMBALI KE MODE MANDOR",
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = Slate700
        )

        Button(
            onClick = { authViewModel.switchRole("MANDOR") },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Emerald600, contentColor = Color.White)
        ) {
            Icon(Icons.Default.Engineering, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Masuk Sebagai Mandor Lapangan", fontWeight = FontWeight.Bold)
        }
    }
}

// -------------------------------------------------------------
// DIALOGS FOR ADMIN CRUD
// -------------------------------------------------------------

@Composable
fun AddEditWorkerDialog(
    worker: Pekerja?,
    onDismiss: () -> Unit,
    onSave: (nama: String, shift: Int) -> Unit
) {
    var nama by remember { mutableStateOf(worker?.nama ?: "") }
    var shift by remember { mutableIntStateOf(worker?.shift ?: 1) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = if (worker == null) "TAMBAH PEKERJA" else "EDIT PEKERJA",
                fontWeight = FontWeight.Black
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = nama,
                    onValueChange = { nama = it },
                    label = { Text("Nama Lengkap Pekerja") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Text("Shift Penugasan:", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { shift = 1 },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (shift == 1) Amber500 else Slate100,
                            contentColor = if (shift == 1) Color.White else Slate700
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Shift 1 (Pagi)")
                    }

                    Button(
                        onClick = { shift = 2 },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (shift == 2) Indigo600 else Slate100,
                            contentColor = if (shift == 2) Color.White else Slate700
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Shift 2 (Malam)")
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (nama.isNotBlank()) {
                        onSave(nama.trim(), shift)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Indigo700)
            ) {
                Text("Simpan", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Batal") }
        }
    )
}

@Composable
fun AddEditModelDialog(
    model: ModelSepatu?,
    onDismiss: () -> Unit,
    onSave: (kode: String, nama: String, kat: String, ongkos: Double, desc: String) -> Unit
) {
    val isEdit = model != null
    var kode by remember { mutableStateOf(model?.kodeModel ?: "") }
    var nama by remember { mutableStateOf(model?.namaModel ?: "") }
    var kategori by remember { mutableStateOf(model?.kategori ?: "Sneakers") }
    var ongkosStr by remember { mutableStateOf(if (model != null) model.ongkosPerPasang.toInt().toString() else "") }
    var desc by remember { mutableStateOf(model?.deskripsi ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(if (isEdit) "EDIT MODEL PRODUK" else "TAMBAH MODEL PRODUK", fontWeight = FontWeight.Black, fontSize = 17.sp)
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = kode,
                    onValueChange = { kode = it },
                    label = { Text("Kode Model (contoh: SNK-AIR-01)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = nama,
                    onValueChange = { nama = it },
                    label = { Text("Nama Model Produk") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = ongkosStr,
                    onValueChange = { ongkosStr = it.filter { ch -> ch.isDigit() } },
                    label = { Text("Ongkos Kerja Per Pasang (Rp)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = desc,
                    onValueChange = { desc = it },
                    label = { Text("Deskripsi / Material") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val ongkos = ongkosStr.toDoubleOrNull() ?: 0.0
                    if (nama.isNotBlank() && kode.isNotBlank() && ongkos > 0) {
                        onSave(kode, nama, kategori, ongkos, desc)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Indigo700)
            ) {
                Text("Simpan", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Batal") }
        }
    )
}

@Composable
fun AddEditPODialog(
    po: ProductionOrder?,
    onDismiss: () -> Unit,
    onSave: (nomor: String, nama: String, target: Int, status: String, catatan: String) -> Unit
) {
    var nomor by remember { mutableStateOf(po?.nomorPo ?: "") }
    var nama by remember { mutableStateOf(po?.namaPo ?: "") }
    var targetStr by remember { mutableStateOf(if (po != null) po.targetPasang.toString() else "") }
    var status by remember { mutableStateOf(po?.status ?: "Proses") }
    var catatan by remember { mutableStateOf(po?.catatan ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = if (po == null) "TAMBAH PO" else "EDIT PO",
                fontWeight = FontWeight.Black
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = nomor,
                    onValueChange = { nomor = it },
                    label = { Text("Nomor PO (e.g. PO-2026-008)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = nama,
                    onValueChange = { nama = it },
                    label = { Text("Nama PO / Buyer") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = targetStr,
                    onValueChange = { targetStr = it.filter { ch -> ch.isDigit() } },
                    label = { Text("Target Pasang") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = status == "Proses",
                        onClick = { status = "Proses" },
                        label = { Text("Proses") }
                    )
                    FilterChip(
                        selected = status == "Selesai",
                        onClick = { status = "Selesai" },
                        label = { Text("Selesai") }
                    )
                }

                OutlinedTextField(
                    value = catatan,
                    onValueChange = { catatan = it },
                    label = { Text("Catatan PO") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val target = targetStr.toIntOrNull() ?: 0
                    if (nomor.isNotBlank() && nama.isNotBlank() && target > 0) {
                        onSave(nomor, nama, target, status, catatan)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Indigo700)
            ) {
                Text("Simpan", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Batal") }
        }
    )
}

// -------------------------------------------------------------
// SLIP GAJI MODAL (PRINTABLE / SHAREABLE TO WA)
// -------------------------------------------------------------
@Composable
fun SlipGajiDialog(
    summary: WorkerWageSummary,
    period: String,
    onDismiss: () -> Unit,
    onCopyWhatsApp: (String) -> Unit
) {
    val worker = summary.pekerja
    val entries = summary.entries

    val rawText = buildString {
        appendLine("========================================")
        appendLine("       SIPRODU - SLIP UPAH KERJA        ")
        appendLine("========================================")
        appendLine("Pekerja  : ${worker.nama} (${worker.nik})")
        appendLine("Bagian   : ${worker.bagian}")
        appendLine("Shift    : ${if (worker.shift == 1) "Shift 1 (Pagi)" else "Shift 2 (Malam)"}")
        appendLine("Periode  : $period")
        appendLine("----------------------------------------")
        appendLine("RINCIAN PRODUKSI:")
        entries.forEachIndexed { i, e ->
            appendLine("${i + 1}. ${e.namaModel} (${e.nomorPo})")
            appendLine("   Ukuran : ${e.sizesJson}")
            appendLine("   Total  : ${e.totalPasang} psg x ${formatRupiah(e.ongkosSatuan)} = ${formatRupiah(e.estimasiUpah)}")
        }
        appendLine("----------------------------------------")
        appendLine("TOTAL PASANG : ${formatNumber(summary.totalPasang)} Pasang")
        appendLine("TOTAL UPAH   : ${formatRupiah(summary.totalUpah)}")
        appendLine("========================================")
        appendLine("Dicetak otomatis oleh SIPRODU")
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("SLIP UPAH KERJA", fontWeight = FontWeight.Black, fontSize = 16.sp)
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Tutup")
                }
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Receipt style card
                Surface(
                    color = Color.White,
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(2.dp, Slate300),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(
                            text = "SIPRODU - BUKTI UPAH KERJA",
                            fontWeight = FontWeight.Black,
                            fontSize = 14.sp,
                            color = Slate900,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                        Text(
                            text = "Sistem Informasi Produksi & Upah",
                            fontSize = 11.sp,
                            color = Slate500,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )

                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Nama Pekerja:", fontSize = 12.sp, color = Slate600)
                            Text(worker.nama, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Shift:", fontSize = 12.sp, color = Slate600)
                            Text(if (worker.shift == 1) "Shift 1 (Pagi)" else "Shift 2 (Malam)", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                        Text("Rincian Transaksi (${entries.size} catatan):", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Slate700)
                        Spacer(modifier = Modifier.height(4.dp))

                        entries.forEach { entry ->
                            Surface(
                                color = Slate50,
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 3.dp)
                            ) {
                                Column(modifier = Modifier.padding(8.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text(entry.namaModel, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                        Text(formatRupiah(entry.estimasiUpah), fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, color = Emerald700)
                                    }
                                    Text("${entry.totalPasang} psg @ ${formatRupiah(entry.ongkosSatuan)} • PO: ${entry.nomorPo}", fontSize = 11.sp, color = Slate600)
                                    SizeChipsRow(sizes = entry.sizes)
                                }
                            }
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Emerald50, RoundedCornerShape(8.dp))
                                .padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("TOTAL PASANG", fontSize = 11.sp, color = Emerald900, fontWeight = FontWeight.Bold)
                                Text("${formatNumber(summary.totalPasang)} Pasang", fontSize = 14.sp, fontWeight = FontWeight.Black, color = Emerald800)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("TOTAL UPAH DITERIMA", fontSize = 11.sp, color = Emerald900, fontWeight = FontWeight.Bold)
                                Text(formatRupiah(summary.totalUpah), fontSize = 16.sp, fontWeight = FontWeight.Black, color = Emerald700)
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onCopyWhatsApp(rawText) },
                colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Salin Teks Slip (Kirim ke WhatsApp)", fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        },
        dismissButton = {}
    )
}
