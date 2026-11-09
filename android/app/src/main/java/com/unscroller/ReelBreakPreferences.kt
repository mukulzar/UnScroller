package com.unscroller

import android.content.Context
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

internal object ReelBreakPreferences {
  private const val PREFS = "reel_break"
  private const val ESTIMATED_MINUTES_PER_BLOCK = 3

  fun get(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun recordBlock(context: Context) {
    val prefs = get(context)
    val today = today()
    if (prefs.getString("statsDate", null) != today) {
      prefs.edit().putString("statsDate", today).putInt("blocksToday", 0).apply()
    }
    prefs.edit()
      .putInt("blocksToday", prefs.getInt("blocksToday", 0) + 1)
      .putInt(
        "minutesSavedToday",
        prefs.getInt("minutesSavedToday", 0) + ESTIMATED_MINUTES_PER_BLOCK,
      )
      .apply()
  }

  fun setPin(context: Context, pin: CharArray) {
    val salt = ByteArray(16).also { SecureRandom().nextBytes(it) }
    val hash = derivePinHash(pin, salt)
    get(context).edit()
      .putString("frictionPinSalt", salt.toHex())
      .putString("frictionPinHash", hash.toHex())
      .apply()
    pin.fill('\u0000')
  }

  fun verifyPin(context: Context, pin: CharArray): Boolean {
    val prefs = get(context)
    val salt = prefs.getString("frictionPinSalt", null)?.hexToBytes() ?: return false
    val expected = prefs.getString("frictionPinHash", null)?.hexToBytes() ?: return false
    val actual = derivePinHash(pin, salt)
    pin.fill('\u0000')
    return MessageDigest.isEqual(expected, actual)
  }

  fun hasPin(context: Context): Boolean =
    get(context).contains("frictionPinHash")

  private fun derivePinHash(pin: CharArray, salt: ByteArray): ByteArray {
    val spec = PBEKeySpec(pin, salt, 120_000, 256)
    return try {
      SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1")
        .generateSecret(spec)
        .encoded
    } finally {
      spec.clearPassword()
    }
  }

  private fun ByteArray.toHex() = joinToString("") { "%02x".format(it) }

  private fun String.hexToBytes() = chunked(2).map { it.toInt(16).toByte() }.toByteArray()

  fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
}
