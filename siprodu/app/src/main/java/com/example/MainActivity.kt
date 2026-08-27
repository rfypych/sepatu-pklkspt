package com.example

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.*
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.theme.Emerald700
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.Slate100
import com.example.ui.theme.Slate700
import com.example.ui.theme.Slate900
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.util.Base64
import android.widget.Toast
import java.io.File
import java.io.FileOutputStream

class WebAppInterface(private val context: Context) {
    @JavascriptInterface
    fun saveFileBase64(base64Data: String, filename: String, mimeType: String) {
        try {
            val cleanBase64 = if (base64Data.contains(",")) {
                base64Data.substringAfter(",")
            } else {
                base64Data
            }
            val bytes = Base64.decode(cleanBase64, Base64.DEFAULT)
            var savedUri: Uri? = null

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }
                val resolver = context.contentResolver
                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                if (uri != null) {
                    resolver.openOutputStream(uri)?.use { out ->
                        out.write(bytes)
                    }
                    savedUri = uri
                }
            } else {
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                if (!downloadsDir.exists()) downloadsDir.mkdirs()
                val file = File(downloadsDir, filename)
                FileOutputStream(file).use { out ->
                    out.write(bytes)
                }
                savedUri = Uri.fromFile(file)
            }

            Handler(Looper.getMainLooper()).post {
                Toast.makeText(context, "✅ File Excel berhasil disimpan di folder Unduhan", Toast.LENGTH_SHORT).show()
                if (savedUri != null) {
                    try {
                        val openIntent = Intent(Intent.ACTION_VIEW).apply {
                            setDataAndType(savedUri, mimeType)
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        val chooser = Intent.createChooser(openIntent, "Buka / Bagikan File Excel").apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        context.startActivity(chooser)
                    } catch (ignored: Exception) {
                        // Jika tidak ada app atau dibatalkan, file tetap aman di folder Download
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Handler(Looper.getMainLooper()).post {
                Toast.makeText(context, "❌ Gagal mengunduh file: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @JavascriptInterface
    fun shareFileBase64(base64Data: String, filename: String, mimeType: String) {
        try {
            val cleanBase64 = if (base64Data.contains(",")) {
                base64Data.substringAfter(",")
            } else {
                base64Data
            }
            val bytes = Base64.decode(cleanBase64, Base64.DEFAULT)

            val cacheFile = File(context.cacheDir, filename)
            FileOutputStream(cacheFile).use { it.write(bytes) }

            val uri = androidx.core.content.FileProvider.getUriForFile(
                context,
                "${context.packageName}.provider",
                cacheFile
            )

            Handler(Looper.getMainLooper()).post {
                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = mimeType
                    putExtra(Intent.EXTRA_STREAM, uri)
                    putExtra(Intent.EXTRA_SUBJECT, "Laporan Excel: $filename")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
                val chooser = Intent.createChooser(shareIntent, "Bagikan File Excel via:").apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(chooser)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Handler(Looper.getMainLooper()).post {
                Toast.makeText(context, "❌ Gagal membagikan file: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}

class MainActivity : ComponentActivity() {

    companion object {
        const val TARGET_URL = "https://web-phi-two-51.vercel.app/"
        const val API_LOGIN_URL = "https://server-eta-six-49.vercel.app/api/auth/login"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            MyApplicationTheme {
                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .systemBarsPadding(),
                    color = Color.White
                ) {
                    WebContainer(url = TARGET_URL)
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebContainer(url: String) {
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var progressVal by remember { mutableFloatStateOf(0f) }
    var isError by remember { mutableStateOf(false) }
    var errorDescription by remember { mutableStateOf("") }

    // Intercept back button to navigate webview history
    BackHandler(enabled = webViewInstance?.canGoBack() == true) {
        webViewInstance?.goBack()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                WebView(context).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )

                    val cookieManager = CookieManager.getInstance()
                    cookieManager.setAcceptCookie(true)
                    cookieManager.setAcceptThirdPartyCookies(this, true)

                    addJavascriptInterface(WebAppInterface(context), "AndroidBridge")

                    setDownloadListener { downloadUrl, userAgent, contentDisposition, mimetype, _ ->
                        try {
                            val filename = URLUtil.guessFileName(downloadUrl, contentDisposition, mimetype)
                            val request = DownloadManager.Request(Uri.parse(downloadUrl)).apply {
                                setMimeType(mimetype)
                                addRequestHeader("cookie", CookieManager.getInstance().getCookie(downloadUrl))
                                addRequestHeader("User-Agent", userAgent)
                                setDescription("Mengunduh $filename...")
                                setTitle(filename)
                                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
                            }
                            val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                            dm.enqueue(request)
                            Toast.makeText(context, "Memulai unduhan: $filename", Toast.LENGTH_SHORT).show()
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }

                    setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null)
                    isVerticalScrollBarEnabled = false
                    isHorizontalScrollBarEnabled = false

                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        databaseEnabled = true
                        cacheMode = WebSettings.LOAD_DEFAULT
                        useWideViewPort = true
                        loadWithOverviewMode = true
                        setSupportZoom(false)
                        builtInZoomControls = false
                        displayZoomControls = false
                        allowFileAccess = true
                        allowContentAccess = true
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        userAgentString = "$userAgentString SepatuMandorApp/1.0"
                        loadsImagesAutomatically = true
                        blockNetworkImage = false
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            offscreenPreRaster = true
                        }
                    }

                    webChromeClient = object : WebChromeClient() {
                        override fun onProgressChanged(view: WebView?, newProgress: Int) {
                            progressVal = newProgress / 100f
                            if (newProgress >= 70) {
                                isLoading = false
                            }
                        }
                    }

                    webViewClient = object : WebViewClient() {
                        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                            super.onPageStarted(view, url, favicon)
                            isError = false
                        }

                        override fun onPageCommitVisible(view: WebView?, url: String?) {
                            super.onPageCommitVisible(view, url)
                            isLoading = false
                        }

                        override fun onPageFinished(view: WebView?, url: String?) {
                            super.onPageFinished(view, url)
                            isLoading = false

                            val loginApi = MainActivity.API_LOGIN_URL
                            val autoLoginScript = """
                                (async function() {
                                    try {
                                        // Jika sudah ada token di localStorage, tidak perlu auto-login
                                        var token = localStorage.getItem('sp_token');
                                        var currentPath = window.location.pathname;
                                        var onLoginPage = currentPath === '/login' || currentPath === '/' || currentPath === '';

                                        if (token && !onLoginPage) {
                                            // Sudah login dan bukan di halaman login, biarkan
                                            return;
                                        }

                                        if (!token) {
                                            // Belum ada token, coba auto-login
                                            var res = await fetch('""" + loginApi + """', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ username: 'mandor', password: 'mandor123' })
                                            });
                                            var data = await res.json();
                                            if (data.token) {
                                                localStorage.setItem('sp_token', data.token);
                                                window.location.replace('/mandor');
                                            }
                                        } else if (onLoginPage) {
                                            // Ada token tapi di halaman login, redirect langsung
                                            window.location.replace('/mandor');
                                        }
                                    } catch (e) {
                                        console.error('Auto login failed', e);
                                    }
                                })();
                            """.trimIndent()

                            view?.evaluateJavascript(autoLoginScript, null)
                        }

                        override fun onReceivedError(
                            view: WebView?,
                            errorCode: Int,
                            description: String?,
                            failingUrl: String?
                        ) {
                            if (failingUrl == null || failingUrl.startsWith("http")) {
                                isError = true
                                errorDescription = description ?: "Tidak dapat terhubung ke server web"
                            }
                        }

                        override fun onReceivedError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            error: WebResourceError?
                        ) {
                            if (request?.isForMainFrame == true) {
                                isError = true
                                errorDescription = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                    error?.description?.toString() ?: "Gagal memuat halaman"
                                } else {
                                    "Gagal memuat halaman"
                                }
                            }
                        }
                    }

                    loadUrl(url)
                    webViewInstance = this
                }
            },
            update = {
                webViewInstance = it
            }
        )

        // Top loading progress bar
        AnimatedVisibility(
            visible = isLoading && !isError,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.align(Alignment.TopCenter)
        ) {
            LinearProgressIndicator(
                progress = progressVal,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp),
                color = Emerald700,
                trackColor = Color.Transparent
            )
        }

        // Offline / Error screen
        if (isError) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Slate100)
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = Color(0xFFFEE2E2),
                            modifier = Modifier.size(64.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    Icons.Default.WifiOff,
                                    contentDescription = null,
                                    tint = Color(0xFFDC2626),
                                    modifier = Modifier.size(32.dp)
                                )
                            }
                        }

                        Text(
                            text = "Tidak Dapat Terhubung",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black,
                            color = Slate900
                        )

                        Text(
                            text = "Pastikan perangkat Anda terhubung ke jaringan WiFi pabrik atau internet aktif.\n\n($errorDescription)",
                            fontSize = 13.sp,
                            color = Slate700,
                            textAlign = TextAlign.Center
                        )

                        Button(
                            onClick = {
                                isError = false
                                webViewInstance?.reload()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald700),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Coba Muat Ulang", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
