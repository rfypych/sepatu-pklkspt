package com.example.data.local

import android.content.Context
import android.content.SharedPreferences
import com.example.data.models.UserProfile

class TokenManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("app_auth_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_TOKEN = "jwt_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USERNAME = "username"
        private const val KEY_NAMA = "nama"
        private const val KEY_ROLE = "role"
        private const val KEY_SHIFT = "shift"
    }

    fun saveAuthSession(token: String, user: UserProfile) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_USER_ID, user.id)
            .putString(KEY_USERNAME, user.username)
            .putString(KEY_NAMA, user.nama)
            .putString(KEY_ROLE, user.role)
            .putInt(KEY_SHIFT, user.shift ?: 1)
            .apply()
    }

    fun setRole(newRole: String) {
        prefs.edit().putString(KEY_ROLE, newRole).apply()
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun getUser(): UserProfile? {
        val username = prefs.getString(KEY_USERNAME, null) ?: return null
        return UserProfile(
            id = prefs.getString(KEY_USER_ID, "") ?: "",
            username = username,
            nama = prefs.getString(KEY_NAMA, username) ?: username,
            role = prefs.getString(KEY_ROLE, "mandor") ?: "mandor",
            shift = prefs.getInt(KEY_SHIFT, 1),
            bagian = "Produksi & Assembling"
        )
    }

    fun isLoggedIn(): Boolean = !prefs.getString(KEY_TOKEN, null).isNullOrEmpty()

    fun getRole(): String = prefs.getString(KEY_ROLE, "mandor") ?: "mandor"

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
