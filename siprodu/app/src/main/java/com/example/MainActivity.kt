package com.example

import android.annotation.SuppressLint
import android.graphics.Bitmap
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

class MainActivity : ComponentActivity() {

    companion object {
        const val TARGET_URL = "https://web-phi-two-51.vercel.app/"
        const val API_LOGIN_URL = "https://sepatu-api.ansein.com/api/auth/login"
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
                    }

                    webChromeClient = object : WebChromeClient() {
                        override fun onProgressChanged(view: WebView?, newProgress: Int) {
                            progressVal = newProgress / 100f
                            isLoading = newProgress < 100
                        }
                    }

                    webViewClient = object : WebViewClient() {
                        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                            super.onPageStarted(view, url, favicon)
                            isError = false
                        }

                        override fun onPageFinished(view: WebView?, url: String?) {
                            super.onPageFinished(view, url)
                            isLoading = false

                            val loginApi = MainActivity.API_LOGIN_URL
                            val autoLoginScript = """
                                (async function() {
                                    try {
                                        var token = localStorage.getItem('sp_token');
                                        if (!token) {
                                            var res = await fetch('""" + loginApi + """', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ username: 'mandor', password: 'mandor123' })
                                            });
                                            var data = await res.json();
                                            if (data.token) {
                                                localStorage.setItem('sp_token', data.token);
                                                if (window.location.pathname === '/login' || window.location.pathname === '/' || window.location.pathname === '') {
                                                    window.location.replace('/mandor');
                                                } else {
                                                    window.location.reload();
                                                }
                                            }
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
