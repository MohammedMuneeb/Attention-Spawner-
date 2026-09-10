package com.attentionarchitecture 

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings 
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module 
import expo.modules.kotlin.modules.ModuleDefinition 

class AttentionArchitectureModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AttentionArchitecture") 
 
    var pendingIntercept = false 
    var pendingBlockedApp: String? = null 

    Events("onIntercept")

    OnNewIntent { intent ->
        if (intent.getBooleanExtra("is_intercept", false)) {
            val blockedApp = intent.getStringExtra("blocked_app")
            intent.removeExtra("is_intercept")
            intent.removeExtra("blocked_app")             
            pendingIntercept = true
            pendingBlockedApp = blockedApp
            
            this@AttentionArchitectureModule.sendEvent("onIntercept", mapOf(
                "blockedApp" to blockedApp
            )) 
        } 
    } 

    Function("setBlockedApps") { apps: List<String> -> 
      val context = appContext.reactContext
      if (context != null) {
        val prefs = context.getSharedPreferences("attention_architecture_prefs", Context.MODE_PRIVATE)
        prefs.edit().putStringSet("blocked_apps", apps.toSet()).apply()
      }
    }

    Function("getBlockedApps") { -> 
      val context = appContext.reactContext ?: return@Function emptyList<String>()
      val prefs = context.getSharedPreferences("attention_architecture_prefs", Context.MODE_PRIVATE)
      return@Function prefs.getStringSet("blocked_apps", setOf())?.toList() ?: emptyList<String>()
    }

    Function("getInstalledApps") { ->
      val context = appContext.reactContext ?: return@Function emptyList<Map<String, String>>()
      val pm = context.packageManager
      val packages = pm.getInstalledApplications(android.content.pm.PackageManager.GET_META_DATA)
      
      val apps = mutableListOf<Map<String, String>>()
      for (app in packages) {
          val launchIntent = pm.getLaunchIntentForPackage(app.packageName)
          if (launchIntent != null && app.packageName != context.packageName) {
              val appName = app.loadLabel(pm).toString()
              apps.add(mapOf(
                  "id" to app.packageName,
                  "name" to appName
              ))
          }
      }
      return@Function apps.sortedBy { it["name"] ?: "" }
    }

    Function("hasUsageStatsPermission") { ->
      val context = appContext.reactContext ?: return@Function false
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      } else {
        appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      }
      return@Function mode == AppOpsManager.MODE_ALLOWED
    }

    Function("openUsageStatsSettings") { ->
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }

    Function("hasOverlayPermission") { ->
      val context = appContext.reactContext ?: return@Function false
      return@Function if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Settings.canDrawOverlays(context)
      } else {
        true
      }
    }

    Function("openOverlaySettings") { ->
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:${context.packageName}")
        )
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }

    Function("startForegroundService") { ->
      val context = appContext.reactContext
      if (context != null) {
        val serviceIntent = Intent(context, AppBlockerForegroundService::class.java)
        ContextCompat.startForegroundService(context, serviceIntent)
      }
    }

    Function("stopForegroundService") { ->
      val context = appContext.reactContext
      if (context != null) {
        val serviceIntent = Intent(context, AppBlockerForegroundService::class.java)
        context.stopService(serviceIntent)
      }
    }

    Function("getInterceptIntent") { ->
        if (pendingIntercept) {
            val app = pendingBlockedApp
            pendingIntercept = false
            pendingBlockedApp = null
            return@Function mapOf("isIntercept" to true, "blockedApp" to app)
        }

        val activity = appContext.currentActivity
        val intent = activity?.intent
        if (intent != null && intent.getBooleanExtra("is_intercept", false)) {
            val blockedApp = intent.getStringExtra("blocked_app")
            intent.removeExtra("is_intercept")
            intent.removeExtra("blocked_app")
            return@Function mapOf(
                "isIntercept" to true,
                "blockedApp" to blockedApp
            )
        }
        return@Function mapOf(
            "isIntercept" to false,
            "blockedApp" to null
        )
    }
  }
}
