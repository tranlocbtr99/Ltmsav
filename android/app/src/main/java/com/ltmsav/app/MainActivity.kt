package com.ltmsav.app

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.fragment.app.FragmentActivity
import com.ltmsav.app.security.BiometricAuthManager

class MainActivity : FragmentActivity() {
    private lateinit var biometricManager: BiometricAuthManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        biometricManager = BiometricAuthManager(this)

        setContent {
            LTMsavAppUI(
                onBiometricAuthenticate = { onSuccess ->
                    biometricManager.promptBiometric(
                        onSuccess = onSuccess,
                        onError = { /* fallback to PIN */ }
                    )
                }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LTMsavAppUI(
    onBiometricAuthenticate: (onSuccess: () -> Unit) -> Unit
) {
    var isLocked by remember { mutableStateOf(false) }
    var selectedTab by remember { mutableIntStateOf(0) }
    val darkTheme = isSystemInDarkTheme()

    val colors = if (darkTheme) {
        darkColorScheme(
            primary = Color(0xFF10B981),
            background = Color(0xFF090D16),
            surface = Color(0xFF0F172A),
            onPrimary = Color.White,
            onBackground = Color(0xFFF1F5F9),
            onSurface = Color(0xFFF1F5F9)
        )
    } else {
        lightColorScheme(
            primary = Color(0xFF059669),
            background = Color(0xFFF8FAFC),
            surface = Color.White,
            onPrimary = Color.White,
            onBackground = Color(0xFF0F172A),
            onSurface = Color(0xFF0F172A)
        )
    }

    MaterialTheme(colorScheme = colors) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "LTM",
                                fontWeight = FontWeight.Black,
                                fontSize = 20.sp
                            )
                            Text(
                                text = "sav",
                                fontWeight = FontWeight.Black,
                                fontSize = 20.sp,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = { isLocked = true }) {
                            Icon(Icons.Default.Lock, contentDescription = "Khóa app")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            },
            bottomBar = {
                NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                    val tabs = listOf(
                        Triple("Tổng quan", Icons.Default.Dashboard, 0),
                        Triple("Giao dịch", Icons.Default.ReceiptLong, 1),
                        Triple("AI", Icons.Default.AutoAwesome, 2),
                        Triple("Ngân sách", Icons.Default.TrackChanges, 3),
                        Triple("Cài đặt", Icons.Default.Settings, 4)
                    )
                    tabs.forEach { (label, icon, index) ->
                        NavigationBarItem(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            icon = { Icon(icon, contentDescription = label) },
                            label = { Text(label, fontSize = 11.sp) }
                        )
                    }
                }
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .background(MaterialTheme.colorScheme.background)
                    .padding(16.dp)
            ) {
                when (selectedTab) {
                    0 -> OverviewScreenView()
                    1 -> TransactionsScreenView()
                    2 -> AiChatScreenView()
                    3 -> BudgetsScreenView()
                    4 -> SettingsScreenView()
                }
            }
        }
    }
}

@Composable
fun OverviewScreenView() {
    Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF065F46))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text("TỔNG TÀI SẢN RÒNG (NET WORTH)", color = Color(0xFFA7F3D0), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                Text("85.000.000 ₫", color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.Black)
            }
        }
        Text("Giao Dịch Gần Đây", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Text("• Cơm trưa: -45.000 ₫ (Tiền mặt)", fontSize = 14.sp)
        Text("• Nhận lương: +22.000.000 ₫ (Vietcombank)", fontSize = 14.sp)
    }
}

@Composable
fun TransactionsScreenView() {
    Column(modifier = Modifier.fillMaxSize()) {
        Text("Lịch Sử Giao Dịch", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Spacer(modifier = Modifier.height(12.dp))
        Text("Nhấn vào bất kỳ giao dịch nào để chỉnh sửa hoặc đảo số dư.", fontSize = 13.sp)
    }
}

@Composable
fun AiChatScreenView() {
    Column(modifier = Modifier.fillMaxSize()) {
        Text("LTMsav AI Assistant", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Nhập câu lệnh tiếng Việt: 'Ăn trưa 45k tiền mặt' để AI ghi chép tự động.", fontSize = 13.sp)
    }
}

@Composable
fun BudgetsScreenView() {
    Column(modifier = Modifier.fillMaxSize()) {
        Text("Hạn Mức Ngân Sách", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Spacer(modifier = Modifier.height(8.dp))
        Text("• Ăn uống: 4.500.000 ₫ / tháng (Đã chi 65%)", fontSize = 14.sp)
    }
}

@Composable
fun SettingsScreenView() {
    Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Cài Đặt & Bản Quyền", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Text("designed by LocTM", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
        Text("Bản quyền: © 2026 LTMsav. All rights reserved.", fontSize = 13.sp)
        Text("Liên hệ: tranlocbtr99@gmail.com", fontSize = 13.sp)
    }
}
