package com.example.ui.screens.mandor

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.models.*
import com.example.ui.components.*
import com.example.ui.theme.*
import com.example.ui.viewmodels.AuthViewModel
import com.example.ui.viewmodels.MandorInputState
import com.example.ui.viewmodels.MandorViewModel

@Composable
fun MandorMainScreen(
    authViewModel: AuthViewModel,
    mandorViewModel: MandorViewModel,
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
                    icon = { Icon(Icons.Default.AddCircleOutline, contentDescription = "Input") },
                    label = { Text("Input", fontWeight = FontWeight.Bold) },
                    modifier = Modifier.testTag("tab_mandor_input"),
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
                    onClick = {
                        selectedTab = 1
                        mandorViewModel.refreshRiwayat()
                    },
                    icon = { Icon(Icons.Default.History, contentDescription = "Riwayat") },
                    label = { Text("Riwayat", fontWeight = FontWeight.Bold) },
                    modifier = Modifier.testTag("tab_mandor_riwayat"),
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
                    icon = { Icon(Icons.AutoMirrored.Filled.HelpOutline, contentDescription = "Bantuan") },
                    label = { Text("Bantuan", fontWeight = FontWeight.Bold) },
                    modifier = Modifier.testTag("tab_mandor_bantuan"),
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
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profil") },
                    label = { Text("Profil", fontWeight = FontWeight.Bold) },
                    modifier = Modifier.testTag("tab_mandor_profil"),
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
                0 -> MandorInputTab(mandorViewModel)
                1 -> MandorRiwayatTab(mandorViewModel)
                2 -> MandorBantuanTab()
                3 -> MandorProfilTab(authViewModel, mandorViewModel)
            }
        }
    }
}

// -------------------------------------------------------------
// TAB 1: INPUT PRODUKSI (PILIH PEKERJA -> LEMBAR INPUT -> MULTI MODEL BATCH)
// -------------------------------------------------------------
@Composable
fun MandorInputTab(viewModel: MandorViewModel) {
    val inputState by viewModel.inputState.collectAsState()
    val workers by viewModel.activeWorkers.collectAsState()
    val todayEntries by viewModel.todayEntries.collectAsState()
    val pos by viewModel.allPOs.collectAsState()
    val models by viewModel.allModels.collectAsState()

    var showAddPoDialog by remember { mutableStateOf(false) }

    if (showAddPoDialog) {
        AddPoDialog(
            onDismiss = { showAddPoDialog = false },
            onConfirm = { noPo, namaPo, target ->
                viewModel.quickAddPO(noPo, namaPo, target)
                showAddPoDialog = false
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate100)
    ) {
        // Top Header
        Surface(
            color = Color.White,
            shadowElevation = 2.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "INPUT PRODUKSI HARIAN",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Black,
                        color = Slate900
                    )
                    Text(
                        text = "Tanggal: ${viewModel.repository.getTodayDateStr()}",
                        fontSize = 12.sp,
                        color = Slate500
                    )
                }
            }
        }

        // Feedback messages
        if (inputState.submitSuccessMsg != null) {
            Surface(
                color = Emerald100,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                shape = RoundedCornerShape(8.dp),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, Emerald600)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald700)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = inputState.submitSuccessMsg ?: "",
                        color = Emerald700,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier.weight(1f)
                    )
                    IconButton(onClick = { viewModel.clearMessages() }, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Tutup", tint = Emerald700, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }

        if (inputState.submitErrorMsg != null) {
            Surface(
                color = Red50,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                shape = RoundedCornerShape(8.dp),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, Red600)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Error, contentDescription = null, tint = Red600)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = inputState.submitErrorMsg ?: "",
                        color = Red600,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier.weight(1f)
                    )
                    IconButton(onClick = { viewModel.clearMessages() }, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Tutup", tint = Red600, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }

        // Dialogs for PO & Model Selection
        var showSelectPoDialog by remember { mutableStateOf(false) }
        var showAddModelDialog by remember { mutableStateOf(false) }

        if (showSelectPoDialog) {
            AlertDialog(
                onDismissRequest = { showSelectPoDialog = false },
                title = { Text("Pilih Nomor Purchase Order (PO)", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
                text = {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        item {
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = if (inputState.selectedPO == null) Color(0xFFF0F9FF) else Slate50,
                                border = androidx.compose.foundation.BorderStroke(1.dp, if (inputState.selectedPO == null) Color(0xFF0284C7) else Slate200),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        viewModel.selectPO(null)
                                        showSelectPoDialog = false
                                    }
                            ) {
                                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text("Tanpa PO (Produksi Bebas / Lewati)", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Slate900)
                                }
                            }
                        }
                        items(pos) { poItem ->
                            val isSel = inputState.selectedPO?.id == poItem.id
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = if (isSel) Color(0xFFF0F9FF) else Slate50,
                                border = androidx.compose.foundation.BorderStroke(1.dp, if (isSel) Color(0xFF0284C7) else Slate200),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        viewModel.selectPO(poItem)
                                        showSelectPoDialog = false
                                    }
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(poItem.nomorPo, fontWeight = FontWeight.Black, fontSize = 14.sp, color = Slate900)
                                        Text("${poItem.selesaiPasang}/${poItem.targetPasang} psg", fontSize = 12.sp, color = Slate600)
                                    }
                                    if (poItem.namaPo.isNotBlank()) {
                                        Text(poItem.namaPo, fontSize = 12.sp, color = Color(0xFF0284C7), fontWeight = FontWeight.Medium)
                                    }
                                }
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = {
                        showSelectPoDialog = false
                        showAddPoDialog = true
                    }) {
                        Text("+ Buat PO Baru", fontWeight = FontWeight.Bold, color = Blue600)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showSelectPoDialog = false }) {
                        Text("Tutup")
                    }
                }
            )
        }

        if (showAddModelDialog) {
            AlertDialog(
                onDismissRequest = { showAddModelDialog = false },
                title = { Text("Pilih Model Sepatu", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
                text = {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(models) { modelItem ->
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = Color.White,
                                border = androidx.compose.foundation.BorderStroke(1.5.dp, Slate200),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        viewModel.addModel(modelItem)
                                        showAddModelDialog = false
                                    }
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(modelItem.namaModel, fontWeight = FontWeight.Black, fontSize = 14.sp, color = Slate900)
                                        Text("Tarif: ${formatRupiah(modelItem.ongkosPerPasang)} / pasang", fontSize = 12.sp, color = Color(0xFF047857), fontWeight = FontWeight.Bold)
                                    }
                                    Icon(Icons.Default.AddCircle, contentDescription = "Tambah", tint = Color(0xFF2563EB))
                                }
                            }
                        }
                    }
                },
                confirmButton = {},
                dismissButton = {
                    TextButton(onClick = { showAddModelDialog = false }) {
                        Text("Batal")
                    }
                }
            )
        }

        // SCREEN A: Pilih Pekerja vs SCREEN B: Lembar Input
        if (inputState.selectedWorker == null) {
            // Screen A: List Pekerja Aktif
            WorkerSelectionView(
                workers = workers,
                todayEntries = todayEntries,
                onSelectWorker = { worker -> viewModel.selectWorker(worker) }
            )
        } else {
            // Screen B: Lembar Input Produksi
            ProductionInputSheet(
                inputState = inputState,
                onShiftChange = { viewModel.setShift(it) },
                onOpenSelectPO = { showSelectPoDialog = true },
                onOpenAddModel = { showAddModelDialog = true },
                onRemoveModel = { viewModel.removeModel(it) },
                onUpdateSize = { entryId, sz, qty -> viewModel.updateModelSizeQuantity(entryId, sz, qty) },
                onBackToWorkerList = { viewModel.clearSelectedWorker() },
                onSubmit = { viewModel.submitProduksi() }
            )
        }
    }
}

@Composable
fun WorkerSelectionView(
    workers: List<Pekerja>,
    todayEntries: List<ProduksiEntry>,
    onSelectWorker: (Pekerja) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp, vertical = 8.dp)
    ) {
        Text(
            text = "PILIH PEKERJA AKTIF",
            fontSize = 13.sp,
            fontWeight = FontWeight.ExtraBold,
            color = Slate700,
            modifier = Modifier.padding(vertical = 6.dp)
        )

        if (workers.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Tidak ada data pekerja aktif.", color = Slate500)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 24.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(workers) { worker ->
                    val workerTodayEntries = todayEntries.filter { it.pekerjaId == worker.id }
                    val totalPairsToday = workerTodayEntries.sumOf { it.totalPasang }
                    val totalWageToday = workerTodayEntries.sumOf { it.estimasiUpah }

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectWorker(worker) }
                            .testTag("card_worker_${worker.id}"),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = androidx.compose.foundation.BorderStroke(2.dp, Slate200),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Avatar
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(CircleShape)
                                    .background(Emerald100)
                                    .border(2.dp, Emerald600, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = worker.nama.take(2).uppercase(),
                                    fontWeight = FontWeight.Black,
                                    fontSize = 16.sp,
                                    color = Emerald800
                                )
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = worker.nama,
                                    fontSize = 17.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Slate900
                                )
                                Text(
                                    text = "Pekerja Produksi",
                                    fontSize = 12.sp,
                                    color = Slate500
                                )

                                Spacer(modifier = Modifier.height(6.dp))

                                val workerShift = if (workerTodayEntries.isNotEmpty()) workerTodayEntries.first().shift else worker.shift

                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    ShiftBadge(shift = workerShift)

                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = Emerald50,
                                        border = androidx.compose.foundation.BorderStroke(1.dp, Emerald200)
                                    ) {
                                        Text(
                                            text = "● Aktif",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Emerald700,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }

                                    if (totalPairsToday > 0) {
                                        Surface(
                                            shape = RoundedCornerShape(6.dp),
                                            color = Blue50,
                                            border = androidx.compose.foundation.BorderStroke(1.dp, Blue200)
                                        ) {
                                            Text(
                                                text = "$totalPairsToday psg • ${formatRupiah(totalWageToday)}",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Blue700,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                }
                            }

                            // Action indicator
                            Icon(
                                imageVector = Icons.Default.ChevronRight,
                                contentDescription = "Pilih",
                                tint = Emerald600,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SizeBoxItem(
    sizeLabel: String,
    quantity: Int,
    onQuantityChanged: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    var textValue by remember(quantity) { mutableStateOf(if (quantity > 0) quantity.toString() else "0") }

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(8.dp),
        color = Color(0xFFF8FAFC),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFCBD5E1))
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 4.dp, vertical = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "No $sizeLabel",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = Slate700
            )

            Spacer(modifier = Modifier.height(4.dp))

            Surface(
                shape = RoundedCornerShape(6.dp),
                color = Color.White,
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (quantity > 0) Color(0xFF38BDF8) else Color(0xFFE2E8F0)
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(34.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    BasicTextField(
                        value = textValue,
                        onValueChange = { input ->
                            val digits = input.filter { it.isDigit() }
                            textValue = digits
                            val num = digits.toIntOrNull() ?: 0
                            onQuantityChanged(num.coerceIn(0, 9999))
                        },
                        textStyle = TextStyle(
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black,
                            textAlign = TextAlign.Center,
                            color = if (quantity > 0) Slate900 else Slate400
                        ),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductionInputSheet(
    inputState: MandorInputState,
    onShiftChange: (Int) -> Unit,
    onOpenSelectPO: () -> Unit,
    onOpenAddModel: () -> Unit,
    onRemoveModel: (String) -> Unit,
    onUpdateSize: (String, String, Int) -> Unit,
    onBackToWorkerList: () -> Unit,
    onSubmit: () -> Unit
) {
    val worker = inputState.selectedWorker ?: return
    val scrollState = rememberScrollState()
    val grandTotalPasang = inputState.draftModels.sumOf { it.totalPasang }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // TOP HEADER: Selected Worker Card
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Slate900),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(Amber500),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        tint = Slate900,
                        modifier = Modifier.size(26.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Pekerja yang Dipilih:",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFFACC15)
                    )
                    Text(
                        text = worker.nama,
                        fontSize = 19.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                }

                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Slate800,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Slate700),
                    modifier = Modifier.clickable { onBackToWorkerList() }
                ) {
                    Text(
                        text = "← Ganti Pekerja",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }
        }

        // SECTION 1: PILIH SHIFT KERJA
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(1.5.dp, Slate200),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "1. PILIH SHIFT KERJA",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Slate900
                )
                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Shift 1
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { onShiftChange(1) }
                            .testTag("btn_select_shift_1"),
                        color = if (inputState.selectedShift == 1) Color(0xFFF8FAFC) else Slate50,
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(
                            if (inputState.selectedShift == 1) 2.dp else 1.dp,
                            if (inputState.selectedShift == 1) Amber500 else Slate200
                        )
                    ) {
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.Center,
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(text = "☀️", fontSize = 14.sp)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "SHIFT 1",
                                    fontWeight = FontWeight.Black,
                                    color = Slate900,
                                    fontSize = 13.sp
                                )
                            }
                            Text(
                                text = "Pagi",
                                fontSize = 11.sp,
                                color = Slate500,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    // Shift 2
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { onShiftChange(2) }
                            .testTag("btn_select_shift_2"),
                        color = if (inputState.selectedShift == 2) Indigo600 else Slate50,
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(
                            if (inputState.selectedShift == 2) 2.dp else 1.dp,
                            if (inputState.selectedShift == 2) Indigo700 else Slate200
                        )
                    ) {
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.Center,
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(text = "🌙", fontSize = 14.sp)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "SHIFT 2",
                                    fontWeight = FontWeight.Black,
                                    color = if (inputState.selectedShift == 2) Color.White else Slate900,
                                    fontSize = 13.sp
                                )
                            }
                            Text(
                                text = "Siang/Malam",
                                fontSize = 11.sp,
                                color = if (inputState.selectedShift == 2) Indigo100 else Slate500,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }

        // SECTION 2: NOMOR PURCHASE ORDER (PO)
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(1.5.dp, Slate200),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "2. NOMOR PURCHASE ORDER (PO)",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Slate900
                )
                Spacer(modifier = Modifier.height(10.dp))

                val po = inputState.selectedPO
                if (po == null) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { onOpenSelectPO() },
                        color = Color(0xFFF0F9FF),
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0xFF38BDF8))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                modifier = Modifier.weight(1f),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.Inventory2,
                                    contentDescription = null,
                                    tint = Color(0xFF0284C7),
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Belum Memilih PO (Ketuk di sini untuk memilih)",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Slate800
                                )
                            }

                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = Color(0xFFBAE6FD),
                                modifier = Modifier.clickable { onOpenSelectPO() }
                            ) {
                                Text(
                                    text = "PILIH PO →",
                                    color = Color(0xFF0369A1),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                )
                            }
                        }
                    }
                } else {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp)),
                        color = Color(0xFFF0F9FF),
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0xFF38BDF8))
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    modifier = Modifier.weight(1f),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.Inventory2,
                                        contentDescription = null,
                                        tint = Color(0xFF0284C7),
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = po.nomorPo,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Slate900
                                    )
                                    if (po.namaPo.isNotBlank()) {
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "(${po.namaPo})",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF0284C7)
                                        )
                                    }
                                }

                                Surface(
                                    shape = RoundedCornerShape(20.dp),
                                    color = Color(0xFF0284C7),
                                    modifier = Modifier.clickable { onOpenSelectPO() }
                                ) {
                                    Text(
                                        text = "Ganti PO",
                                        color = Color.White,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            val target = if (po.targetPasang > 0) po.targetPasang else 1
                            val achieved = po.selesaiPasang
                            val remaining = (po.targetPasang - achieved).coerceAtLeast(0)

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "$achieved / ${po.targetPasang} pasang",
                                    fontSize = 11.sp,
                                    color = Slate600,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = "Sisa $remaining psg",
                                    fontSize = 11.sp,
                                    color = Slate600,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            LinearProgressIndicator(
                                progress = { (achieved.toFloat() / target.toFloat()).coerceIn(0f, 1f) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(3.dp)),
                                color = Color(0xFF0F172A),
                                trackColor = Slate200
                            )

                            val newTyping = inputState.draftModels.sumOf { it.totalPasang }
                            if (newTyping > 0) {
                                Spacer(modifier = Modifier.height(6.dp))
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = Color(0xFFD1FAE5)
                                ) {
                                    Text(
                                        text = "+$newTyping pasang baru sedang diketik",
                                        color = Color(0xFF065F46),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // SECTION 3: ISI JUMLAH UKURAN SEPATU
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(1.5.dp, Slate200),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "3. ISI JUMLAH UKURAN SEPATU",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Slate900
                        )
                        Text(
                            text = "Ketik jumlah pasang sesuai nomor ukuran",
                            fontSize = 11.sp,
                            color = Slate500
                        )
                    }

                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = Color(0xFF2563EB),
                        modifier = Modifier.clickable { onOpenAddModel() }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "+ TAMBAH MODEL",
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (inputState.draftModels.isEmpty()) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp)),
                        color = Slate50,
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Slate200)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Default.Layers,
                                contentDescription = null,
                                tint = Slate400,
                                modifier = Modifier.size(36.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Belum ada model sepatu yang dipilih.",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate800
                            )
                            Text(
                                text = "Tekan tombol biru + TAMBAH MODEL di atas untuk mulai mengisi.",
                                fontSize = 11.sp,
                                color = Slate500
                            )
                        }
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        inputState.draftModels.forEach { draftEntry ->
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = Color.White,
                                border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0xFF34D399)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    // Model Header
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column {
                                            Text(
                                                text = draftEntry.model.namaModel,
                                                fontSize = 15.sp,
                                                fontWeight = FontWeight.Black,
                                                color = Slate900
                                            )
                                            Text(
                                                text = "Tarif Upah: ${formatRupiah(draftEntry.model.ongkosPerPasang)} / pasang",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF047857)
                                            )
                                        }

                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Surface(
                                                shape = RoundedCornerShape(20.dp),
                                                color = Color(0xFF059669)
                                            ) {
                                                Text(
                                                    text = "Total: ${draftEntry.totalPasang} psg",
                                                    color = Color.White,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Black,
                                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                                )
                                            }

                                            Surface(
                                                shape = RoundedCornerShape(8.dp),
                                                color = Color.White,
                                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFCA5A5)),
                                                modifier = Modifier
                                                    .size(32.dp)
                                                    .clickable { onRemoveModel(draftEntry.id) }
                                            ) {
                                                Box(contentAlignment = Alignment.Center) {
                                                    Icon(
                                                        Icons.Default.DeleteOutline,
                                                        contentDescription = "Hapus",
                                                        tint = Color(0xFFEF4444),
                                                        modifier = Modifier.size(18.dp)
                                                    )
                                                }
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    // Grid of size boxes: 4 columns
                                    val allSizes = listOf("36", "37", "38", "39", "40", "41", "42", "43", "44")
                                    allSizes.chunked(4).forEach { rowSizes ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 3.dp),
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            rowSizes.forEach { sz ->
                                                val qty = draftEntry.sizeMap[sz] ?: 0
                                                SizeBoxItem(
                                                    sizeLabel = sz,
                                                    quantity = qty,
                                                    onQuantityChanged = { newQ ->
                                                        onUpdateSize(draftEntry.id, sz, newQ)
                                                    },
                                                    modifier = Modifier.weight(1f)
                                                )
                                            }
                                            // Fill trailing spaces for the last row
                                            for (k in 0 until (4 - rowSizes.size)) {
                                                Spacer(modifier = Modifier.weight(1f))
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

        // SECTION 4: BOTTOM TOTAL HASIL KERJA
        val savedPairs = inputState.savedInitialPairs
        val isChanged = inputState.hasModified || (grandTotalPasang != savedPairs)
        val newUnsaved = if (grandTotalPasang > savedPairs) grandTotalPasang - savedPairs else 0

        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Slate900),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "TOTAL HASIL KERJA:",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "$grandTotalPasang Pasang",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF10B981)
                    )
                }

                if (grandTotalPasang > 0) {
                    Spacer(modifier = Modifier.height(4.dp))
                    val statusText = if (savedPairs > 0 && !isChanged) {
                        "($savedPairs tersimpan + 0 pasang baru belum disimpan)"
                    } else if (savedPairs > 0) {
                        "($savedPairs tersimpan + $newUnsaved pasang baru belum disimpan)"
                    } else {
                        "(0 tersimpan + $grandTotalPasang pasang baru belum disimpan)"
                    }
                    Text(
                        text = statusText,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFFFACC15)
                    )
                }
            }
        }

        // SECTION 5: ACTION BUTTON (SIMPAN / SUDAH TERSIMPAN)
        if (grandTotalPasang == 0 || (grandTotalPasang > 0 && !isChanged)) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                color = Color(0xFFF1F5F9),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0xFF059669).copy(alpha = 0.5f))
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = "✓ SEMUA DATA SUDAH TERSIMPAN",
                        color = Color(0xFF059669),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        } else {
            Button(
                onClick = onSubmit,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp)
                    .testTag("btn_submit_produksi"),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF059669),
                    contentColor = Color.White
                ),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 3.dp),
                enabled = !inputState.isSubmitting
            ) {
                if (inputState.isSubmitting) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "SIMPAN HASIL PRODUKSI ($grandTotalPasang PASANG)",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
    }
}

// -------------------------------------------------------------
// TAB 2: RIWAYAT PRODUKSI (Harian / Bulanan / Tahunan)
// -------------------------------------------------------------
@Composable
fun MandorRiwayatTab(viewModel: MandorViewModel) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val riwayatState by viewModel.riwayatState.collectAsState()
    val todayDate = viewModel.repository.getTodayDateStr()

    var viewMode by remember { mutableStateOf("tabel") } // "tabel" (default) or "kartu"
    var editingEntry by remember { mutableStateOf<ProduksiEntry?>(null) }
    var deletingEntryId by remember { mutableStateOf<String?>(null) }

    if (editingEntry != null) {
        EditProduksiDialog(
            entry = editingEntry!!,
            onDismiss = { editingEntry = null },
            onSave = { updated ->
                viewModel.updateProduksiRecord(updated)
                editingEntry = null
            }
        )
    }

    if (deletingEntryId != null) {
        AlertDialog(
            onDismissRequest = { deletingEntryId = null },
            title = { Text("Hapus Catatan Produksi?", fontWeight = FontWeight.Bold) },
            text = { Text("Data produksi ini akan dihapus permanen dari sistem.") },
            confirmButton = {
                Button(
                    onClick = {
                        deletingEntryId?.let { viewModel.deleteProduksiRecord(it) }
                        deletingEntryId = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Red600)
                ) {
                    Text("Ya, Hapus")
                }
            },
            dismissButton = {
                TextButton(onClick = { deletingEntryId = null }) { Text("Batal") }
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate100)
    ) {
        // Header & Filter Bar
        Surface(
            color = Color.White,
            shadowElevation = 2.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "RIWAYAT PRODUKSI MANDOR",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        color = Slate900
                    )

                    // Export Excel Button
                    FilledTonalButton(
                        onClick = {
                            if (riwayatState.items.isNotEmpty()) {
                                exportRiwayatToExcel(context, riwayatState.items, riwayatState.filterType)
                            } else {
                                android.widget.Toast.makeText(context, "Tidak ada data untuk diunduh", android.widget.Toast.LENGTH_SHORT).show()
                            }
                        },
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = Emerald50,
                            contentColor = Emerald700
                        ),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Download,
                            contentDescription = "Unduh",
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Unduh XLSX",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Filter Buttons: Harian, Bulanan, Tahunan
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("Harian", "Bulanan", "Tahunan").forEach { filter ->
                        val isSelected = riwayatState.filterType == filter
                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .height(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { viewModel.setRiwayatFilter(filter) }
                                .testTag("filter_btn_$filter"),
                            color = if (isSelected) Blue600 else Slate100,
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isSelected) Blue700 else Slate200
                            )
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = filter,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = if (isSelected) Color.White else Slate700
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // View Mode Switcher: Tabel (Default) vs Kartu
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Slate100, RoundedCornerShape(8.dp))
                        .padding(3.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .height(32.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .clickable { viewMode = "tabel" },
                        color = if (viewMode == "tabel") Color.White else Color.Transparent,
                        shape = RoundedCornerShape(6.dp),
                        shadowElevation = if (viewMode == "tabel") 2.dp else 0.dp
                    ) {
                        Row(
                            modifier = Modifier.fillMaxSize(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.TableChart,
                                contentDescription = null,
                                tint = if (viewMode == "tabel") Blue700 else Slate600,
                                modifier = Modifier.size(15.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Tampilan Tabel (Default)",
                                fontSize = 11.sp,
                                fontWeight = if (viewMode == "tabel") FontWeight.ExtraBold else FontWeight.Medium,
                                color = if (viewMode == "tabel") Blue700 else Slate600
                            )
                        }
                    }

                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .height(32.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .clickable { viewMode = "kartu" },
                        color = if (viewMode == "kartu") Color.White else Color.Transparent,
                        shape = RoundedCornerShape(6.dp),
                        shadowElevation = if (viewMode == "kartu") 2.dp else 0.dp
                    ) {
                        Row(
                            modifier = Modifier.fillMaxSize(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.ViewAgenda,
                                contentDescription = null,
                                tint = if (viewMode == "kartu") Blue700 else Slate600,
                                modifier = Modifier.size(15.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Tampilan Kartu",
                                fontSize = 11.sp,
                                fontWeight = if (viewMode == "kartu") FontWeight.ExtraBold else FontWeight.Medium,
                                color = if (viewMode == "kartu") Blue700 else Slate600
                            )
                        }
                    }
                }
            }
        }

        // Summary Metric Cards: Total Pasang & Estimasi Upah
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MetricCard(
                title = "Total Pasang",
                value = "${formatNumber(riwayatState.totalPasang)} psg",
                subtitle = "${riwayatState.items.size} transaksi",
                icon = Icons.Default.Inventory2,
                accentColor = Blue600,
                modifier = Modifier.weight(1f)
            )

            MetricCard(
                title = "Estimasi Upah",
                value = formatRupiah(riwayatState.totalUpah),
                subtitle = "Total upah",
                icon = Icons.Default.Payments,
                accentColor = Emerald600,
                modifier = Modifier.weight(1f)
            )
        }

        // Feedback
        if (riwayatState.actionSuccessMsg != null) {
            Surface(
                color = Emerald100,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 4.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = riwayatState.actionSuccessMsg ?: "",
                    color = Emerald700,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(10.dp)
                )
            }
        }

        // Production Records List / Table
        if (riwayatState.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Blue600)
            }
        } else if (riwayatState.items.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Inbox, contentDescription = null, tint = Slate500, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Belum ada catatan produksi untuk periode ini.", color = Slate500, fontSize = 14.sp)
                }
            }
        } else if (viewMode == "tabel") {
            // ==========================================
            // TAMPILAN TABEL (VERSI WEB MIRROR)
            // ==========================================
            val horizontalScroll = rememberScrollState()

            Card(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 14.dp, vertical = 4.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, Slate200),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .horizontalScroll(horizontalScroll)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxHeight()
                            .width(1080.dp)
                    ) {
                        // Header Tabel
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Slate800)
                                .padding(vertical = 12.dp, horizontal = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Pekerja", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(140.dp))
                            Text("Tanggal", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(90.dp))
                            Text("Shift", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(70.dp), textAlign = TextAlign.Center)
                            Text("Model", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(130.dp))
                            Text("No PO", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(110.dp))
                            Text("Rincian Size (36–44)", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(200.dp))
                            Text("Pasang", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(75.dp), textAlign = TextAlign.End)
                            Text("Ongkos", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(80.dp), textAlign = TextAlign.End)
                            Text("Subtotal", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(100.dp), textAlign = TextAlign.End)
                            Text("Aksi", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(85.dp), textAlign = TextAlign.Center)
                        }

                        // Baris Data Tabel
                        LazyColumn(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth()
                        ) {
                            itemsIndexed(riwayatState.items) { index: Int, item: ProduksiEntry ->
                                val isEven = index % 2 == 0
                                val isToday = item.tanggal == todayDate

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(if (isEven) Color.White else Slate50)
                                        .padding(vertical = 10.dp, horizontal = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    // Pekerja
                                    Text(item.pekerjaNama, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = Slate900, modifier = Modifier.width(140.dp))
                                    // Tanggal
                                    Text(item.tanggal, fontSize = 11.sp, color = Slate600, modifier = Modifier.width(90.dp))
                                    // Shift
                                    Box(modifier = Modifier.width(70.dp), contentAlignment = Alignment.Center) {
                                        Surface(
                                            color = if (item.shift == 1) Amber100 else Indigo100,
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text(
                                                if (item.shift == 1) "S1" else "S2",
                                                color = if (item.shift == 1) Amber800 else Indigo800,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                    // Model
                                    Text(item.namaModel, fontSize = 12.sp, color = Slate800, modifier = Modifier.width(130.dp))
                                    // PO
                                    Text(if (item.nomorPo.isBlank()) "-" else item.nomorPo, fontSize = 11.sp, color = Blue700, fontWeight = FontWeight.Medium, modifier = Modifier.width(110.dp))
                                    // Rincian Size (compact: "38:10 39:15 40:20")
                                    val szStr = item.sizes.toMap().filter { entry -> entry.value > 0 }.map { entry -> "${entry.key}:${entry.value}" }.joinToString(" ")
                                    Text(if (szStr.isBlank()) "-" else szStr, fontSize = 11.sp, color = Slate700, modifier = Modifier.width(200.dp))
                                    // Pasang
                                    Text("${item.totalPasang}", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Blue800, modifier = Modifier.width(75.dp), textAlign = TextAlign.End)
                                    // Ongkos
                                    Text(formatNumber(item.ongkosSatuan.toInt()), fontSize = 11.sp, color = Slate600, modifier = Modifier.width(80.dp), textAlign = TextAlign.End)
                                    // Subtotal
                                    Text(formatRupiah(item.estimasiUpah), fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Emerald700, modifier = Modifier.width(100.dp), textAlign = TextAlign.End)
                                    // Aksi
                                    Row(
                                        modifier = Modifier.width(85.dp),
                                        horizontalArrangement = Arrangement.Center,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        if (isToday) {
                                            IconButton(
                                                onClick = { editingEntry = item },
                                                modifier = Modifier.size(26.dp)
                                            ) {
                                                Icon(Icons.Default.Edit, contentDescription = "Edit", tint = Blue600, modifier = Modifier.size(15.dp))
                                            }
                                            IconButton(
                                                onClick = { deletingEntryId = item.id },
                                                modifier = Modifier.size(26.dp)
                                            ) {
                                                Icon(Icons.Default.Delete, contentDescription = "Hapus", tint = Red600, modifier = Modifier.size(15.dp))
                                            }
                                        } else {
                                            Icon(Icons.Default.Lock, contentDescription = "Terkunci", tint = Slate400, modifier = Modifier.size(15.dp))
                                        }
                                    }
                                }
                                HorizontalDivider(color = Slate200, thickness = 0.5.dp)
                            }
                        }

                        // Footer Total Tabel
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Slate200)
                                .padding(vertical = 12.dp, horizontal = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("TOTAL", fontWeight = FontWeight.Black, fontSize = 12.sp, color = Slate900, modifier = Modifier.width(740.dp))
                            Text("${riwayatState.totalPasang} psg", fontWeight = FontWeight.Black, fontSize = 12.sp, color = Blue800, modifier = Modifier.width(75.dp), textAlign = TextAlign.End)
                            Text("", modifier = Modifier.width(80.dp))
                            Text(formatRupiah(riwayatState.totalUpah), fontWeight = FontWeight.Black, fontSize = 12.sp, color = Emerald800, modifier = Modifier.width(100.dp), textAlign = TextAlign.End)
                            Text("", modifier = Modifier.width(85.dp))
                        }
                    }
                }
            }
        } else {
            // ==========================================
            // TAMPILAN KARTU (CARD VIEW)
            // ==========================================
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 24.dp)
            ) {
                items(riwayatState.items) { item ->
                    val isToday = item.tanggal == todayDate

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("item_riwayat_${item.id}"),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = androidx.compose.foundation.BorderStroke(2.dp, Slate200),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            // Row 1: Worker & Wage
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = item.pekerjaNama,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Slate900
                                    )
                                    Text(
                                        text = "${item.namaModel} • ${item.nomorPo}",
                                        fontSize = 13.sp,
                                        color = Slate700,
                                        fontWeight = FontWeight.Medium
                                    )
                                }

                                Text(
                                    text = formatRupiah(item.estimasiUpah),
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Emerald700
                                )
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            // Badges: Shift & Total Pairs
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                ShiftBadge(shift = item.shift)
                                Surface(
                                    color = Blue50,
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = "${item.totalPasang} Pasang",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = Blue700,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                                Text(
                                    text = item.tanggal,
                                    fontSize = 12.sp,
                                    color = Slate500,
                                    modifier = Modifier.weight(1f),
                                    textAlign = TextAlign.End
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            // Size matrix pills
                            SizeChipsRow(sizes = item.sizes)

                            // Edit & Delete actions for today's records
                            if (isToday) {
                                Spacer(modifier = Modifier.height(10.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    OutlinedButton(
                                        onClick = { editingEntry = item },
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                        modifier = Modifier.height(34.dp)
                                    ) {
                                        Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Edit", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }

                                    Spacer(modifier = Modifier.width(8.dp))

                                    Button(
                                        onClick = { deletingEntryId = item.id },
                                        shape = RoundedCornerShape(8.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = Red50, contentColor = Red600),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                        modifier = Modifier.height(34.dp)
                                    ) {
                                        Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(14.dp), tint = Red600)
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Hapus", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Red600)
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
// TAB 3: BANTUAN & PANDUAN MANDOR
// -------------------------------------------------------------
@Composable
fun MandorBantuanTab() {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate100)
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = "PANDUAN OPERASIONAL MANDOR",
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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Checklist, contentDescription = null, tint = Emerald600)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("1. Cara Input Produksi Harian", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "• Pilih nama pekerja di layar awal tab Input.\n" +
                           "• Pastikan Shift (Pagi/Malam) dan Nomor PO sesuai SPK.\n" +
                           "• Pilih Model Sepatu yang dikerjakan.\n" +
                           "• Masukkan jumlah pasang tiap nomor ukuran (36 s/d 44) menggunakan tombol (+) (-) jempol atau ketik langsung angka di kolom.\n" +
                           "• Tekan '+ Tambah Model Ini ke Antrian' jika pekerja mengerjakan lebih dari 1 model dalam hari yang sama.\n" +
                           "• Tekan tombol hijau 'SIMPAN BATCH PRODUKSI' untuk mencatat.",
                    fontSize = 13.sp,
                    color = Slate700,
                    lineHeight = 20.sp
                )
            }
        }

        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(2.dp, Slate200)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Calculate, contentDescription = null, tint = Blue600)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("2. Perhitungan Upah Kerja", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "• Upah kerja dihitung otomatis: Total Pasang x Ongkos Satuan Model.\n" +
                           "• Contoh: 60 pasang Sneaker Sport @ Rp 4.500 = Rp 270.000.\n" +
                           "• Rekapitulasi dapat dicek langsung di tab Riwayat.",
                    fontSize = 13.sp,
                    color = Slate700,
                    lineHeight = 20.sp
                )
            }
        }

        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(2.dp, Slate200)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Cached, contentDescription = null, tint = Amber600)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("3. Fleksibilitas Shift & Edit Data", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "• Mandor bertugas mencatat dan mengawasi seluruh aktivitas produksi tanpa terikat satu shift.\n" +
                           "• Pilihan Shift 1 (Pagi: 07.00-15.00) atau Shift 2 (Malam: 15.00-23.00) pada lembar input disesuaikan dengan jam kerja pekerja.\n" +
                           "• Data hari berjalan dapat diedit atau dihapus jika terdapat salah input sebelum pergantian hari.",
                    fontSize = 13.sp,
                    color = Slate700,
                    lineHeight = 20.sp
                )
            }
        }
    }
}

// -------------------------------------------------------------
// TAB 4: PROFIL & SWITCH ROLE
// -------------------------------------------------------------
@Composable
fun MandorProfilTab(
    authViewModel: AuthViewModel,
    mandorViewModel: MandorViewModel
) {
    val currentUser by authViewModel.currentUser.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate100)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = "PROFIL MANDOR & AKUN",
            fontSize = 18.sp,
            fontWeight = FontWeight.Black,
            color = Slate900
        )

        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(2.dp, Slate200)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(Emerald100)
                        .border(3.dp, Emerald600, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Engineering,
                        contentDescription = null,
                        modifier = Modifier.size(40.dp),
                        tint = Emerald700
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = currentUser.namaLengkap,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = Slate900
                )
                Text(
                    text = "Role: Mandor Lapangan (Pencatatan & Pengawasan)",
                    fontSize = 13.sp,
                    color = Slate600
                )

                Spacer(modifier = Modifier.height(10.dp))
                Surface(
                    color = Emerald50,
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Emerald600)
                ) {
                    Text(
                        text = "Pengawas Produksi Semua Shift",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = Emerald800,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    )
                }
            }
        }

        Text(
            text = "GANTI ROLE / AKUN DEMO",
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = Slate700
        )

        // Switch role buttons
        Button(
            onClick = { authViewModel.switchRole("MANDOR") },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .testTag("switch_to_mandor"),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Emerald600, contentColor = Color.White)
        ) {
            Icon(Icons.Default.Engineering, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Masuk Sebagai: Mandor Lapangan", fontWeight = FontWeight.Bold)
        }

        Button(
            onClick = { authViewModel.switchRole("ADMIN") },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .testTag("switch_to_admin"),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Slate900, contentColor = Color.White)
        ) {
            Icon(Icons.Default.AdminPanelSettings, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Beralih ke Panel Admin", fontWeight = FontWeight.Bold)
        }
    }
}
