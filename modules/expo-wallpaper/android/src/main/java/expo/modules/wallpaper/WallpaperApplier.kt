package expo.modules.wallpaper

import android.app.WallpaperManager
import android.content.Context
import android.os.Build

/** Renders and applies the lock-screen wallpaper. Shared by the module and worker. */
object WallpaperApplier {

  fun isSupported(): Boolean = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N

  /**
   * Applies the wallpaper for the current queue index without advancing it.
   * Used for the immediate "apply now" from JS. Returns true on success.
   */
  fun applyCurrent(context: Context): Boolean {
    val config = ConfigStore.load(context) ?: return false
    if (!config.enabled || config.queue.isEmpty()) return false
    val idx = config.index.coerceIn(0, config.queue.size - 1)
    return renderAndSet(context, config, idx)
  }

  /**
   * Advances to the next fact, applies it, and persists the new index.
   * Used by the periodic worker. Returns true on success.
   */
  fun applyNext(context: Context): Boolean {
    val config = ConfigStore.load(context) ?: return false
    if (!config.enabled || config.queue.isEmpty()) return false
    val next = (config.index + 1) % config.queue.size
    val ok = renderAndSet(context, config, next)
    if (ok) ConfigStore.saveIndex(context, next)
    return ok
  }

  private fun renderAndSet(context: Context, config: WallpaperConfig, index: Int): Boolean {
    if (!isSupported()) return false
    return try {
      val (category, fact) = config.queue[index]
      val bitmap = WallpaperRenderer.render(context, config, category, fact)
      val wm = WallpaperManager.getInstance(context)
      wm.setBitmap(bitmap, null, true, WallpaperManager.FLAG_LOCK)
      bitmap.recycle()
      true
    } catch (e: Exception) {
      false
    }
  }
}
