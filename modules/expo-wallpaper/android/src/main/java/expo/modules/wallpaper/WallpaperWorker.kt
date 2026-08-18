package expo.modules.wallpaper

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters

/**
 * Periodic worker that advances to the next fact and refreshes the lock-screen
 * wallpaper. Runs with no JS runtime involved.
 */
class WallpaperWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  override fun doWork(): Result {
    return try {
      // A disabled/empty config is a valid no-op, not a failure.
      WallpaperApplier.applyNext(applicationContext)
      Result.success()
    } catch (e: Exception) {
      Result.retry()
    }
  }
}
