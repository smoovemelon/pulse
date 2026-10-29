package com.altius.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "SaveBackup")
public class SaveBackupPlugin extends Plugin {
    @PluginMethod
    public void save(PluginCall call) {
        String data = call.getString("data");
        if (data == null || data.isEmpty()) {
            call.reject("Missing backup");
            return;
        }
        String filename = call.getString("filename", "altius-backup.json");
        if (filename == null || filename.trim().isEmpty()) filename = "altius-backup.json";
        int slash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));
        if (slash >= 0) filename = filename.substring(slash + 1);

        try {
            String uri = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                ? writeMediaStore(filename, data)
                : writeLegacy(filename, data);
            JSObject result = new JSObject();
            result.put("uri", uri);
            call.resolve(result);
        } catch (Exception error) {
            call.reject(error.getMessage() == null ? "Could not save backup" : error.getMessage(), error);
        }
    }

    private String writeMediaStore(String filename, String data) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        Uri collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        resolver.delete(collection, MediaStore.Downloads.DISPLAY_NAME + "=?", new String[] { filename });
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
        values.put(MediaStore.Downloads.MIME_TYPE, "application/json");
        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
        values.put(MediaStore.Downloads.IS_PENDING, 1);
        Uri uri = resolver.insert(collection, values);
        if (uri == null) throw new IllegalStateException("Could not create the download");
        try (OutputStream stream = resolver.openOutputStream(uri)) {
            if (stream == null) throw new IllegalStateException("Could not write the download");
            stream.write(data.getBytes(StandardCharsets.UTF_8));
        }
        ContentValues ready = new ContentValues();
        ready.put(MediaStore.Downloads.IS_PENDING, 0);
        resolver.update(uri, ready, null, null);
        return uri.toString();
    }

    private String writeLegacy(String filename, String data) throws Exception {
        File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("Could not open Downloads");
        File file = new File(dir, filename);
        try (FileOutputStream stream = new FileOutputStream(file)) {
            stream.write(data.getBytes(StandardCharsets.UTF_8));
        }
        return Uri.fromFile(file).toString();
    }
}
