package com.unscroller

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import java.util.ArrayDeque

class ReelBreakAccessibilityService : AccessibilityService() {
  override fun onServiceConnected() {
    super.onServiceConnected()
    refreshServiceInfo()
    instance = this
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null || WATCHED_EVENTS and event.eventType == 0) return

    val packageName = event.packageName?.toString()
    val isYouTube = packageName == ReelBreakModule.YOUTUBE_PACKAGE
    val isInstagram = packageName == ReelBreakModule.INSTAGRAM_PACKAGE
    if (!isYouTube && !isInstagram) return

    val prefs = ReelBreakPreferences.get(this)
    val targetEnabled = if (isYouTube) {
      prefs.getBoolean("youtubeEnabled", true)
    } else {
      prefs.getBoolean("instagramEnabled", true)
    }
    if (!prefs.getBoolean("enabled", false) || !targetEnabled ||
      prefs.getLong("pausedUntil", 0L) > System.currentTimeMillis()
    ) {
      return
    }

    val root = rootInActiveWindow
    if (root == null || root.packageName?.toString() != packageName) {
      return
    }
    if (!looksLikeShortFormFeed(root, isYouTube)) {
      return
    }
    val now = System.currentTimeMillis()
    val lastInterceptKey = "lastInterceptAt_$packageName"
    if (now - prefs.getLong(lastInterceptKey, 0L) < INTERCEPT_RETRY_MS) return

    prefs.edit().putLong(lastInterceptKey, now).apply()
    ReelBreakPreferences.recordBlock(this)
    intercept(prefs.getString("action", "home"), prefs.getString("redirectPackage", ""))
  }

  override fun onInterrupt() = Unit

  override fun onDestroy() {
    if (instance === this) instance = null
    super.onDestroy()
  }

  private fun refreshServiceInfo() {
    val prefs = ReelBreakPreferences.get(this)
    val packages = buildList {
      if (prefs.getBoolean("youtubeEnabled", true)) add(ReelBreakModule.YOUTUBE_PACKAGE)
      if (prefs.getBoolean("instagramEnabled", true)) add(ReelBreakModule.INSTAGRAM_PACKAGE)
    }
    serviceInfo = serviceInfo?.apply {
      eventTypes = WATCHED_EVENTS
      packageNames = if (packages.isEmpty()) arrayOf(packageName) else packages.toTypedArray()
      feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
      notificationTimeout = 250
      flags = flags or AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
    } ?: AccessibilityServiceInfo().apply {
      eventTypes = WATCHED_EVENTS
      packageNames = if (packages.isEmpty()) arrayOf(packageName) else packages.toTypedArray()
      feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
      notificationTimeout = 250
      flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
    }
  }

  private fun looksLikeShortFormFeed(root: AccessibilityNodeInfo, isYouTube: Boolean): Boolean {
    val visibleResourceIds = ArrayList<String>()
    val resourceIds = ArrayList<String>()
    val nodes = ArrayDeque<AccessibilityNodeInfo>()
    nodes.add(root)
    var visited = 0
    while (nodes.isNotEmpty() && visited < MAX_NODES) {
      val node = nodes.removeFirst()
      visited++
      if (isYouTube) {
        node.viewIdResourceName?.lowercase()?.let(resourceIds::add)
      }
      if (node.isVisibleToUser) {
        node.viewIdResourceName?.lowercase()?.let(visibleResourceIds::add)
      }
      for (index in 0 until node.childCount) {
        node.getChild(index)?.let(nodes::addLast)
      }
    }
    return if (isYouTube) {
      isYouTubeShorts(resourceIds)
    } else {
      isInstagramReels(visibleResourceIds)
    }
  }

  private fun isYouTubeShorts(resourceIds: List<String>): Boolean =
    resourceIds.any { id -> YOUTUBE_SHORTS_PLAYER_IDS.any(id::contains) }

  private fun isInstagramReels(resourceIds: List<String>): Boolean =
    resourceIds.any { it.contains("clips_viewer") } &&
      resourceIds.none { it.contains("story_viewer") }

  private fun intercept(action: String?, redirectPackage: String?) {
    if (performGlobalAction(GLOBAL_ACTION_BACK)) {
      Handler(Looper.getMainLooper()).postDelayed(
        { performConfiguredAction(action, redirectPackage) },
        EXIT_SHORTS_DELAY_MS,
      )
      return
    }
    performConfiguredAction(action, redirectPackage)
  }

  private fun performConfiguredAction(action: String?, redirectPackage: String?) {
    when (action) {
      "app" -> {
        val launchIntent = redirectPackage
          ?.takeIf(String::isNotBlank)
          ?.let(packageManager::getLaunchIntentForPackage)
        if (launchIntent != null) {
          launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          startActivity(launchIntent)
        } else {
          performGlobalAction(GLOBAL_ACTION_HOME)
        }
      }
      "pause" -> {
        ReelBreakPreferences.get(this).edit().putBoolean("mindfulPausePending", true).apply()
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        if (launchIntent != null) startActivity(launchIntent) else performGlobalAction(GLOBAL_ACTION_HOME)
      }
      else -> performGlobalAction(GLOBAL_ACTION_HOME)
    }
  }

  companion object {
    private const val MAX_NODES = 1_500
    private const val INTERCEPT_RETRY_MS = 1_000L
    private const val EXIT_SHORTS_DELAY_MS = 400L
    private val YOUTUBE_SHORTS_PLAYER_IDS = listOf(
      "reel_player_page_container",
      "reel_player_page_content",
    )
    private const val WATCHED_EVENTS =
      AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
        AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or
        AccessibilityEvent.TYPE_VIEW_SCROLLED

    @Volatile private var instance: ReelBreakAccessibilityService? = null

    fun refreshRunningService(context: Context) {
      instance?.refreshServiceInfo()
    }
  }
}
