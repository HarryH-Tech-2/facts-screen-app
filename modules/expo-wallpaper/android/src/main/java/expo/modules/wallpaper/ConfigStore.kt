package expo.modules.wallpaper

import android.content.Context
import org.json.JSONObject

/** Immutable snapshot of the wallpaper config the JS layer wrote. */
data class WallpaperConfig(
  val mode: String,
  val photoPath: String?,
  val colorTop: Int,
  val colorMid: Int,
  val colorBottom: Int,
  val colorText: Int,
  val colorMuted: Int,
  val queue: List<Pair<String, String>>, // (category, text)
  val index: Int,
  val intervalMinutes: Int,
  val enabled: Boolean
)

/**
 * Persists the wallpaper config as JSON in SharedPreferences. This is the single
 * source of truth shared between the JS layer (writer) and the background worker
 * (reader). The worker also advances `index` here after each render.
 */
object ConfigStore {
  private const val PREFS = "expo_wallpaper"
  private const val KEY_CONFIG = "config"

  fun save(context: Context, configJson: String) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_CONFIG, configJson)
      .apply()
  }

  fun load(context: Context): WallpaperConfig? {
    val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(KEY_CONFIG, null) ?: return null
    return try {
      parse(raw)
    } catch (e: Exception) {
      null
    }
  }

  /** Persists a new index (used to advance through the queue between renders). */
  fun saveIndex(context: Context, index: Int) {
    val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(KEY_CONFIG, null) ?: return
    val obj = JSONObject(raw)
    obj.put("index", index)
    save(context, obj.toString())
  }

  private fun parse(raw: String): WallpaperConfig {
    val obj = JSONObject(raw)
    val colors = obj.getJSONObject("themeColors")

    val queueJson = obj.getJSONArray("queue")
    val queue = ArrayList<Pair<String, String>>(queueJson.length())
    for (i in 0 until queueJson.length()) {
      val item = queueJson.getJSONObject(i)
      queue.add(Pair(item.optString("category", ""), item.optString("text", "")))
    }

    return WallpaperConfig(
      mode = obj.optString("mode", "generated"),
      photoPath = obj.optString("photoPath", "").ifEmpty { null },
      colorTop = parseColor(colors.optString("top", "#0B1026")),
      colorMid = parseColor(colors.optString("mid", "#141B3C")),
      colorBottom = parseColor(colors.optString("bottom", "#1E2749")),
      colorText = parseColor(colors.optString("text", "#FFFFFF")),
      colorMuted = parseColor(colors.optString("muted", "#AEB4D6")),
      queue = queue,
      index = obj.optInt("index", 0),
      intervalMinutes = obj.optInt("intervalMinutes", 15),
      enabled = obj.optBoolean("enabled", false)
    )
  }

  private fun parseColor(hex: String): Int {
    return try {
      android.graphics.Color.parseColor(hex)
    } catch (e: Exception) {
      android.graphics.Color.BLACK
    }
  }
}
