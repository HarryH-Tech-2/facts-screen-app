package expo.modules.wallpaper

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.TimeUnit

class ExpoWallpaperModule : Module() {

  private val context: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoWallpaper")

    Function("isSupported") {
      WallpaperApplier.isSupported()
    }

    AsyncFunction("applyNow") { configJson: String ->
      ConfigStore.save(context, configJson)
      WallpaperApplier.applyCurrent(context)
    }

    AsyncFunction("schedule") { intervalMinutes: Int ->
      val minutes = intervalMinutes.toLong().coerceAtLeast(15L)
      val request = PeriodicWorkRequestBuilder<WallpaperWorker>(minutes, TimeUnit.MINUTES)
        .build()
      WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        WORK_NAME,
        ExistingPeriodicWorkPolicy.UPDATE,
        request
      )
    }

    AsyncFunction("cancel") {
      WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
    }

    AsyncFunction("importPhoto") { uri: String ->
      PhotoImporter.import(context, uri)
    }
  }

  companion object {
    private const val WORK_NAME = "expo-wallpaper-refresh"
  }
}
