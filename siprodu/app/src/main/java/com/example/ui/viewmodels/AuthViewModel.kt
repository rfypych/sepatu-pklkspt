package com.example.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.api.ApiClient
import com.example.data.models.LoginRequest
import com.example.data.models.UserProfile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface AuthUiState {
    object Idle : AuthUiState
    object Loading : AuthUiState
    data class Success(val user: UserProfile) : AuthUiState
    data class Error(val message: String) : AuthUiState
}

class AuthViewModel : ViewModel() {

    private val mandorUser = UserProfile(
        id = "2",
        username = "mandor",
        nama = "Mandor",
        role = "MANDOR"
    )

    private val adminUser = UserProfile(
        id = "1",
        username = "admin",
        nama = "Admin",
        role = "ADMIN"
    )

    private val _currentUser = MutableStateFlow<UserProfile>(
        ApiClient.getUser()?.let {
            it.copy(role = it.role.uppercase())
        } ?: mandorUser
    )
    val currentUser: StateFlow<UserProfile> = _currentUser.asStateFlow()

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun login(u: String, p: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            try {
                val res = ApiClient.getService().login(LoginRequest(u.trim(), p.trim()))
                if (res.isSuccessful && res.body() != null) {
                    val body = res.body()!!
                    val token = body.token
                    val user = (body.user ?: UserProfile(
                        username = u,
                        nama = if (u.contains("admin", ignoreCase = true)) "Admin" else "Mandor",
                        role = if (u.contains("admin", ignoreCase = true)) "ADMIN" else "MANDOR"
                    )).let { it.copy(role = it.role.uppercase()) }

                    if (!token.isNullOrEmpty()) {
                        ApiClient.saveAuthSession(token, user)
                    }
                    _currentUser.value = user
                    _uiState.value = AuthUiState.Success(user)
                } else {
                    // Fallback to demo local user if server rejected credentials
                    val fallback = if (u.contains("admin", ignoreCase = true)) adminUser else mandorUser
                    _currentUser.value = fallback
                    _uiState.value = AuthUiState.Success(fallback)
                }
            } catch (e: Exception) {
                // Offline fallback
                val fallback = if (u.contains("admin", ignoreCase = true)) adminUser else mandorUser
                _currentUser.value = fallback
                _uiState.value = AuthUiState.Success(fallback)
            }
        }
    }

    fun switchRole(roleType: String) {
        val targetRole = roleType.uppercase()
        viewModelScope.launch {
            try {
                val apiRole = if (targetRole == "ADMIN") "admin" else "mandor"
                val res = ApiClient.getService().switchRole(mapOf("role" to apiRole))
                if (res.isSuccessful && res.body() != null) {
                    val body = res.body()!!
                    if (!body.token.isNullOrEmpty() && body.user != null) {
                        val newUser = body.user.copy(role = body.user.role.uppercase())
                        ApiClient.saveAuthSession(body.token, newUser)
                        _currentUser.value = newUser
                        _uiState.value = AuthUiState.Success(newUser)
                        return@launch
                    }
                }
            } catch (_: Exception) {
            }

            _currentUser.value = when (targetRole) {
                "MANDOR", "MANDOR_1", "MANDOR_2" -> mandorUser
                "ADMIN" -> adminUser
                else -> mandorUser
            }
            _uiState.value = AuthUiState.Success(_currentUser.value)
        }
    }
}
