package expo.modules.wallpaper

import android.content.Context
import android.net.Uri
import java.io.File
import java.io.FileOutputStream

/**
 * Copies a picked image (content:// or file:// uri) into app-internal storage so
 * the background worker can decode it later without media permissions.
 */
object PhotoImporter {
  private const val FILE_NAME = "wallpaper-photo.jpg"

  fun import(context: Context, uri: String): String {
    val dest = File(context.filesDir, FILE_NAME)
    context.contentResolver.openInputStream(Uri.parse(uri)).use { input ->
      requireNotNull(input) { "Could not open input stream for $uri" }
      FileOutputStream(dest).use { output ->
        input.copyTo(output)
      }
    }
    return dest.absolutePath
  }
}
