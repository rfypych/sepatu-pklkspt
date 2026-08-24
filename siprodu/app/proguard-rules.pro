# Add project specific ProGuard rules here.

# OkHttp & Optional Security/TLS Providers
-dontwarn okio.**
-dontwarn okhttp3.**
-dontwarn okhttp3.internal.platform.**
-dontwarn org.bouncycastle.jsse.**
-dontwarn org.conscrypt.**
-dontwarn org.openjsse.**
-dontwarn javax.annotation.**

# Retrofit
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-keepclassmembers,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}

# Moshi JSON
-dontwarn com.squareup.moshi.**
-keepclassmembers class * {
    @com.squareup.moshi.* <fields>;
    @com.squareup.moshi.* <methods>;
}
-keep @com.squareup.moshi.JsonClass class * { *; }

# Room SQLite
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Coroutines
-dontwarn kotlinx.coroutines.**

# Data Models
-keep class com.example.data.models.** { *; }
-keepclassmembers class com.example.data.models.** { *; }
