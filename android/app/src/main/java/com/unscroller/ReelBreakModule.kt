package com.unscroller

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.bridge.NativeModule
import com.facebook.react.ReactPackage
import com.facebook.react.uimanager.ViewManager

class ReelBreakModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  override fun getName() = "ReelBreakModule"

  @ReactMethod
  fun getSettings(promise: Promise) {
    try {
      val prefs = ReelBreakPreferences.get(context)
      val today = ReelBreakPreferences.today()
      val isToday = prefs.getString("statsDate", null) == today
      val map = WritableNativeMap()
      map.putBoolean("enabled", prefs.getBoolean("enabled", false))
      map.putBoolean("youtubeEnabled", prefs.getBoolean("youtubeEnabled", true))
      map.putBoolean("instagramEnabled", prefs.getBoolean("instagramEnabled", true))
      map.putString("action", prefs.getString("action", "home"))
      map.putString("redirectPackage", prefs.getString("redirectPackage", ""))
      map.putInt("pauseDurationMinutes", prefs.getInt("pauseDurationMinutes", 15))
      map.putDouble("pausedUntil", prefs.getLong("pausedUntil", 0L).toDouble())
      map.putBoolean("frictionEnabled", prefs.getBoolean("frictionEnabled", false))
      map.putBoolean("hasFrictionPin", ReelBreakPreferences.hasPin(context))
      map.putInt("blocksToday", if (isToday) prefs.getInt("blocksToday", 0) else 0)
      map.putInt("minutesSavedToday", if (isToday) prefs.getInt("minutesSavedToday", 0) else 0)
      map.putBoolean("accessibilityEnabled", isAccessibilityEnabled())
      map.putBoolean("mindfulPausePending", prefs.getBoolean("mindfulPausePending", false))
      promise.resolve(map)
    } catch (error: Exception) {
      promise.reject("SETTINGS_READ_FAILED", "Unable to load UnScroller settings.", error)
    }
  }

  @ReactMethod
  fun updateSettings(changes: ReadableMap, promise: Promise) {
    try {
      val editor = ReelBreakPreferences.get(context).edit()
      if (changes.hasKey("enabled")) editor.putBoolean("enabled", changes.getBoolean("enabled"))
      if (changes.hasKey("youtubeEnabled")) editor.putBoolean("youtubeEnabled", changes.getBoolean("youtubeEnabled"))
      if (changes.hasKey("instagramEnabled")) editor.putBoolean("instagramEnabled", changes.getBoolean("instagramEnabled"))
      if (changes.hasKey("frictionEnabled")) editor.putBoolean("frictionEnabled", changes.getBoolean("frictionEnabled"))
      if (changes.hasKey("action")) editor.putString("action", changes.getString("action"))
      if (changes.hasKey("redirectPackage")) editor.putString("redirectPackage", changes.getString("redirectPackage"))
      if (changes.hasKey("pauseDurationMinutes")) editor.putInt("pauseDurationMinutes", changes.getInt("pauseDurationMinutes"))
      if (changes.hasKey("pausedUntil")) editor.putLong("pausedUntil", changes.getDouble("pausedUntil").toLong())
      if (changes.hasKey("mindfulPausePending")) editor.putBoolean("mindfulPausePending", changes.getBoolean("mindfulPausePending"))
      editor.apply()
      ReelBreakAccessibilityService.refreshRunningService(context)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("SETTINGS_SAVE_FAILED", "Unable to save UnScroller settings.", error)
    }
  }

  @ReactMethod
  fun isAccessibilityEnabled(promise: Promise) {
    promise.resolve(isAccessibilityEnabled())
  }

  @ReactMethod
  fun openAccessibilitySettings(promise: Promise) {
    try {
      context.startActivity(
        Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("ACCESSIBILITY_SETTINGS_FAILED", "Unable to open Accessibility settings.", error)
    }
  }

  @ReactMethod
  fun getLaunchableApps(promise: Promise) {
    try {
      val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val apps = context.packageManager.queryIntentActivities(intent, 0)
        .filter { it.activityInfo.packageName != context.packageName }
        .filter { it.activityInfo.packageName != YOUTUBE_PACKAGE && it.activityInfo.packageName != INSTAGRAM_PACKAGE }
        .distinctBy { it.activityInfo.packageName }
        .sortedBy { it.loadLabel(context.packageManager).toString().lowercase() }
      val result = WritableNativeArray()
      apps.forEach { info ->
        val item = WritableNativeMap()
        item.putString("packageName", info.activityInfo.packageName)
        item.putString("label", info.loadLabel(context.packageManager).toString())
        result.pushMap(item)
      }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("APP_LIST_FAILED", "Unable to list apps for redirection.", error)
    }
  }

  @ReactMethod
  fun setFrictionPin(pin: String, promise: Promise) {
    if (!pin.matches(Regex("\\d{4,8}"))) {
      promise.reject("INVALID_PIN", "The code must contain 4 to 8 digits.")
      return
    }
    try {
      ReelBreakPreferences.setPin(context, pin.toCharArray())
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("PIN_SAVE_FAILED", "Unable to save the friction code.", error)
    }
  }

  @ReactMethod
  fun verifyFrictionPin(pin: String, promise: Promise) {
    try {
      promise.resolve(ReelBreakPreferences.verifyPin(context, pin.toCharArray()))
    } catch (error: Exception) {
      promise.reject("PIN_VERIFY_FAILED", "Unable to verify the friction code.", error)
    }
  }

  @ReactMethod
  fun finishMindfulPause(promise: Promise) {
    try {
      context.currentActivity?.finish()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("PAUSE_FINISH_FAILED", "Unable to close the mindful pause screen.", error)
    }
  }

  private fun isAccessibilityEnabled(): Boolean {
    val manager = context.getSystemService(AccessibilityManager::class.java) ?: return false
    val serviceComponent = ComponentName(context, ReelBreakAccessibilityService::class.java)
    return manager.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
      .any { serviceComponent == ComponentName.unflattenFromString(it.id) }
  }

  companion object {
    const val YOUTUBE_PACKAGE = "com.google.android.youtube"
    const val INSTAGRAM_PACKAGE = "com.instagram.android"
  }
}

class ReelBreakPackage : ReactPackage {
  @Suppress("DEPRECATION")
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(ReelBreakModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
