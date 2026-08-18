package expo.modules.wallpaper

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.util.DisplayMetrics
import android.view.WindowManager
import kotlin.math.max

/** Draws the fact bitmap for either the generated or photo style. */
object WallpaperRenderer {

  fun render(context: Context, config: WallpaperConfig, category: String, fact: String): Bitmap {
    val (width, height) = screenSize(context)
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)

    if (config.mode == "photo" && config.photoPath != null) {
      drawPhotoBackground(canvas, width, height, config.photoPath)
      drawScrim(canvas, width, height)
    } else {
      drawGradient(canvas, width, height, config.colorTop, config.colorMid, config.colorBottom)
    }

    drawText(canvas, width, height, category, fact, config.colorText, config.colorMuted)
    return bitmap
  }

  private fun screenSize(context: Context): Pair<Int, Int> {
    val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val metrics = DisplayMetrics()
    @Suppress("DEPRECATION")
    wm.defaultDisplay.getRealMetrics(metrics)
    val w = if (metrics.widthPixels > 0) metrics.widthPixels else 1080
    val h = if (metrics.heightPixels > 0) metrics.heightPixels else 1920
    return Pair(w, h)
  }

  private fun drawGradient(canvas: Canvas, w: Int, h: Int, top: Int, mid: Int, bottom: Int) {
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    paint.shader = LinearGradient(
      0f, 0f, 0f, h.toFloat(),
      intArrayOf(top, mid, bottom),
      floatArrayOf(0f, 0.55f, 1f),
      Shader.TileMode.CLAMP
    )
    canvas.drawRect(0f, 0f, w.toFloat(), h.toFloat(), paint)
  }

  private fun drawPhotoBackground(canvas: Canvas, w: Int, h: Int, path: String) {
    val bmp = BitmapFactory.decodeFile(path)
    if (bmp == null) {
      // Fall back to a dark fill if the photo can't be decoded.
      canvas.drawColor(Color.parseColor("#0B1026"))
      return
    }
    // Center-crop the source to fill the target rect.
    val scale = max(w.toFloat() / bmp.width, h.toFloat() / bmp.height)
    val scaledW = bmp.width * scale
    val scaledH = bmp.height * scale
    val left = (w - scaledW) / 2f
    val top = (h - scaledH) / 2f
    val dst = RectF(left, top, left + scaledW, top + scaledH)
    canvas.drawBitmap(bmp, null, dst, Paint(Paint.FILTER_BITMAP_FLAG))
    bmp.recycle()
  }

  private fun drawScrim(canvas: Canvas, w: Int, h: Int) {
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    paint.shader = LinearGradient(
      0f, 0f, 0f, h.toFloat(),
      intArrayOf(
        Color.argb(40, 0, 0, 0),
        Color.argb(30, 0, 0, 0),
        Color.argb(220, 0, 0, 0)
      ),
      floatArrayOf(0f, 0.45f, 1f),
      Shader.TileMode.CLAMP
    )
    canvas.drawRect(0f, 0f, w.toFloat(), h.toFloat(), paint)
  }

  private fun drawText(
    canvas: Canvas, w: Int, h: Int,
    category: String, fact: String, textColor: Int, mutedColor: Int
  ) {
    val margin = w * 0.09f
    val maxTextWidth = (w - margin * 2).toInt().coerceAtLeast(1)

    // Fact text — large, wrapped, centered.
    val factPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
      color = textColor
      textSize = w * 0.062f
      typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    }
    val factLayout = StaticLayout.Builder
      .obtain(fact, 0, fact.length, factPaint, maxTextWidth)
      .setAlignment(Layout.Alignment.ALIGN_CENTER)
      .setLineSpacing(0f, 1.15f)
      .build()

    // Category label — small, uppercase, muted.
    val label = category.uppercase()
    val labelPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
      color = mutedColor
      textSize = w * 0.033f
      letterSpacing = 0.12f
      typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
    }
    val labelLayout = StaticLayout.Builder
      .obtain(label, 0, label.length, labelPaint, maxTextWidth)
      .setAlignment(Layout.Alignment.ALIGN_CENTER)
      .build()

    val gap = h * 0.02f
    val blockHeight = labelLayout.height + gap + factLayout.height
    // Anchor the text block around 62% down the screen (below the clock).
    val startY = (h * 0.62f) - blockHeight / 2f

    canvas.save()
    canvas.translate(margin, startY)
    labelLayout.draw(canvas)
    canvas.restore()

    canvas.save()
    canvas.translate(margin, startY + labelLayout.height + gap)
    factLayout.draw(canvas)
    canvas.restore()
  }
}
