use tauri::{AppHandle, Manager, State};
use std::fs;
use std::time::Duration;
use crate::DbState;
use crate::models::song::SongResponse;

#[derive(serde::Deserialize)]
pub struct DownloadTrackInput {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: Option<String>,
    pub thumbnail: Option<String>,
    pub duration: i64,
}

pub fn sanitize_filename(name: &str, max_len: usize) -> String {
    let cleaned: String = name
        .chars()
        .map(|c| if r#"\/:*?"<>|'#"#.contains(c) || c.is_control() { '_' } else { c })
        .collect();
    let trimmed = cleaned.trim().trim_matches('.').trim();
    if trimmed.is_empty() {
        "track".to_string()
    } else if trimmed.chars().count() > max_len {
        trimmed.chars().take(max_len).collect()
    } else {
        trimmed.to_string()
    }
}

pub fn clean_title_for_lyrics(title: &str) -> String {
    let mut out = String::new();
    let mut depth = 0;
    for c in title.chars() {
        if c == '(' || c == '[' {
            depth += 1;
        } else if c == ')' || c == ']' {
            if depth > 0 { depth -= 1; }
        } else if depth == 0 {
            out.push(c);
        }
    }
    let noise_patterns = [
        "official video",
        "music video",
        "official audio",
        "lyric video",
        "lyrics",
        "remastered",
        "remaster",
        "audio",
        "hd",
        "4k",
    ];

    let mut result = out;
    for noise in &noise_patterns {
        while let Some(idx) = result.to_lowercase().find(noise) {
            result.replace_range(idx..idx + noise.len(), "");
        }
    }

    let trimmed = result.trim().trim_matches('-').trim().to_string();
    if trimmed.is_empty() {
        title.to_string()
    } else {
        trimmed
    }
}

pub fn resolve_downloads_dir(app_handle: &AppHandle) -> std::path::PathBuf {
    let app_dir = app_handle.path().app_data_dir().unwrap_or_else(|_| {
        #[cfg(target_os = "android")]
        {
            std::path::PathBuf::from("/data/data/com.sonara.stream/files")
        }
        #[cfg(not(target_os = "android"))]
        {
            std::path::PathBuf::from(".")
        }
    });
    app_dir.join("downloads")
}

pub fn get_download_http_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(300)) // 5 minutes for full track downloads
        .connect_timeout(Duration::from_secs(15))
        .pool_idle_timeout(Duration::from_secs(90))
        .user_agent("Mozilla/5.0 (Linux; Android 11) SonaraStream/0.6.3")
        .build()
        .unwrap_or_default()
}

#[tauri::command]
pub async fn download_online_track(
    app_handle: AppHandle,
    db: State<'_, DbState>,
    input: DownloadTrackInput,
) -> Result<SongResponse, String> {
    // 1. Resolve direct stream URL with retry
    let stream_url = crate::youtube::resolve_stream_url_internal(
        input.id.clone(),
        Some(true),
        Duration::from_secs(30),
    ).await.map_err(|e| format!("Failed to resolve audio stream: {}", e))?;

    // 2. Prepare downloads directory
    let downloads_dir = resolve_downloads_dir(&app_handle);
    if !downloads_dir.exists() {
        fs::create_dir_all(&downloads_dir)
            .map_err(|e| format!("Failed to create downloads directory {:?}: {}", downloads_dir, e))?;
    }

    // 3. Clean filenames to prevent path limit and illegal character failures
    let safe_artist = sanitize_filename(&input.artist, 50);
    let safe_title = sanitize_filename(&input.title, 50);
    let safe_id = sanitize_filename(&input.id, 30);
    let file_base = format!("{} - {} [{}]", safe_artist, safe_title, safe_id);
    let audio_file_name = format!("{}.m4a", file_base);
    let dest_audio_path = downloads_dir.join(&audio_file_name);

    // 4. Stream audio directly to disk
    let client = get_download_http_client();
    let mut resp = client
        .get(&stream_url)
        .header("User-Agent", "com.google.android.youtube/21.26.364 (Linux; U; Android 11) gzip")
        .send()
        .await
        .map_err(|e| format!("Audio stream request failed: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Download stream returned HTTP status {}", resp.status()));
    }

    let temp_audio_path = downloads_dir.join(format!("{}.tmp", file_base));
    let mut file = fs::File::create(&temp_audio_path)
        .map_err(|e| format!("Failed to create temporary audio file at {:?}: {}", temp_audio_path, e))?;

    let mut file_size: i64 = 0;
    while let Some(chunk) = resp.chunk().await.map_err(|e| {
        let _ = fs::remove_file(&temp_audio_path);
        format!("Failed downloading stream chunk: {}", e)
    })? {
        file_size += chunk.len() as i64;
        if let Err(e) = std::io::Write::write_all(&mut file, &chunk) {
            let _ = fs::remove_file(&temp_audio_path);
            return Err(format!("Failed writing stream chunk to disk: {}", e));
        }
    }

    if let Err(e) = std::io::Write::flush(&mut file) {
        let _ = fs::remove_file(&temp_audio_path);
        return Err(format!("Failed flushing audio stream to disk: {}", e));
    }
    drop(file);

    if file_size < 10000 {
        let _ = fs::remove_file(&temp_audio_path);
        return Err("Downloaded file is too small or incomplete (< 10 KB)".into());
    }

    if let Err(e) = fs::rename(&temp_audio_path, &dest_audio_path) {
        let _ = fs::remove_file(&temp_audio_path);
        return Err(format!("Failed to atomically finalize audio file at {:?}: {}", dest_audio_path, e));
    }

    // 5. Download artwork if available
    let mut local_cover_path: Option<String> = None;
    let mut raw_cover_bytes: Option<Vec<u8>> = None;
    if let Some(ref thumb_url) = input.thumbnail {
        if thumb_url.starts_with("http") {
            let cover_file_name = format!("{}.jpg", file_base);
            let dest_cover_path = downloads_dir.join(&cover_file_name);
            if let Ok(cover_resp) = client.get(thumb_url).send().await {
                if let Ok(cover_bytes) = cover_resp.bytes().await {
                    let bytes_vec = cover_bytes.to_vec();
                    if fs::write(&dest_cover_path, &bytes_vec).is_ok() {
                        local_cover_path = Some(dest_cover_path.to_string_lossy().to_string());
                    }
                    raw_cover_bytes = Some(bytes_vec);
                }
            }
        }
    }

    // 6. Fetch synchronized & plain lyrics from LRCLIB
    let mut synced_lyrics: Option<String> = None;
    let mut plain_lyrics: Option<String> = None;
    let clean_title = clean_title_for_lyrics(&input.title);
    let lrclib_url = format!(
        "https://lrclib.net/api/get?artist_name={}&track_name={}&duration={}",
        urlencoding::encode(&input.artist),
        urlencoding::encode(&clean_title),
        input.duration
    );
    if let Ok(lrc_resp) = client.get(&lrclib_url).send().await {
        if lrc_resp.status().is_success() {
            if let Ok(lrc_json) = lrc_resp.json::<serde_json::Value>().await {
                synced_lyrics = lrc_json.get("syncedLyrics").and_then(|v| v.as_str()).map(|s| s.to_string());
                plain_lyrics = lrc_json.get("plainLyrics").and_then(|v| v.as_str()).map(|s| s.to_string());
            }
        }
    }

    // Save companion .lrc file right alongside audio file for external player support
    if let Some(ref synced) = synced_lyrics {
        let lrc_file_name = format!("{}.lrc", file_base);
        let dest_lrc_path = downloads_dir.join(&lrc_file_name);
        let _ = fs::write(&dest_lrc_path, synced);
    }

    // 7. Embed full metadata tags (ID3v2 / MP4 atoms: Title, Artist, Album, Cover Art, Lyrics) into audio file
    let lyrics_for_tag = plain_lyrics.as_deref().or(synced_lyrics.as_deref());
    let _ = crate::services::audio_tagger::embed_metadata(
        &dest_audio_path,
        &input.title,
        &input.artist,
        input.album.as_deref(),
        None,
        lyrics_for_tag,
        raw_cover_bytes.as_deref(),
    );

    // 8. Update database record idempotently
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let (artist_id, _) = crate::repositories::artist_repository::find_or_create(&conn, &input.artist)
        .map_err(|e| e.to_string())?;

    let album_name = input.album.unwrap_or_else(|| "Downloads".to_string());
    let (album_id, _) = crate::repositories::album_repository::find_or_create(&conn, &album_name, artist_id)
        .map_err(|e| e.to_string())?;

    if let Some(ref cover) = local_cover_path {
        let _ = crate::repositories::album_repository::update_cover_path(&conn, album_id, cover, "found");
    }

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let local_path = dest_audio_path.to_string_lossy().to_string();
    let online_path = format!("online://youtube/{}", input.id);

    // Check if song already exists with either local_path OR online_path
    let existing_id: Option<i64> = conn.query_row(
        "SELECT id FROM songs WHERE path = ?1 OR path = ?2",
        rusqlite::params![local_path, online_path],
        |r| r.get(0),
    ).ok();

    let final_id = if let Some(id) = existing_id {
        conn.execute(
            "UPDATE songs 
             SET path = ?1, file_size = ?2, file_modified_at = ?3, album_id = ?4, artist_id = ?5 
             WHERE id = ?6",
            rusqlite::params![local_path, file_size, now, album_id, artist_id, id],
        ).map_err(|e| format!("Failed to update existing song: {}", e))?;
        id
    } else {
        conn.execute(
            "INSERT INTO songs (title, duration, path, is_favorite, favorite_added_at, track_number, created_at, folder_id, album_id, artist_id, file_modified_at, file_size)
             VALUES (?1, ?2, ?3, 0, NULL, 1, ?4, NULL, ?5, ?6, ?4, ?7)",
            rusqlite::params![input.title, input.duration, local_path, now, album_id, artist_id, file_size],
        ).map_err(|e| format!("Failed to insert downloaded song into DB: {}", e))?;
        conn.last_insert_rowid()
    };

    // 9. Persist lyrics into database for instant offline synced lyrics playback
    if let Some(lrc_content) = synced_lyrics.as_ref().or(plain_lyrics.as_ref()) {
        let _ = crate::repositories::lyrics_repository::update_lyrics_content(
            &conn,
            final_id,
            lrc_content,
            "found",
            "lrclib",
        );
    }

    crate::repositories::song_repository::get_by_id(&conn, final_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_track_downloaded(
    app_handle: AppHandle,
    id: String,
) -> Result<bool, String> {
    let clean_id = id.trim();
    if clean_id.is_empty() {
        return Ok(false);
    }
    let downloads_dir = resolve_downloads_dir(&app_handle);
    if !downloads_dir.exists() {
        return Ok(false);
    }
    let pattern = format!("[{}]", clean_id);
    if let Ok(entries) = fs::read_dir(downloads_dir) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            let name_lower = name.to_ascii_lowercase();
            if name.contains(&pattern) && (name_lower.ends_with(".m4a") || name_lower.ends_with(".mp3")) {
                if let Ok(meta) = entry.metadata() {
                    if meta.is_file() && meta.len() > 10000 {
                        return Ok(true);
                    }
                }
            }
        }
    }
    Ok(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("Queen / Bohemian : Rhapsody *?", 50), "Queen _ Bohemian _ Rhapsody __");
        assert_eq!(sanitize_filename("   hello...   ", 50), "hello");
        assert_eq!(sanitize_filename("", 50), "track");
        let long_name = "a".repeat(100);
        assert_eq!(sanitize_filename(&long_name, 30).len(), 30);
    }

    #[test]
    fn test_is_track_downloaded_pattern() {
        let pattern = format!("[{}]", "fJ9rUzIMcZQ");
        let audio_sample = "Queen - Bohemian Rhapsody [fJ9rUzIMcZQ].m4a";
        let image_sample = "Queen - Bohemian Rhapsody [fJ9rUzIMcZQ].jpg";
        assert!(audio_sample.contains(&pattern) && (audio_sample.ends_with(".m4a") || audio_sample.ends_with(".mp3")));
        assert!(!(image_sample.ends_with(".m4a") || image_sample.ends_with(".mp3")), "Image artwork must not be recognized as downloaded audio");
        let diff = "Queen - Bohemian Rhapsody [otherId].m4a";
        assert!(!diff.contains(&pattern));
    }

    #[test]
    fn test_idempotent_db_download_records() {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        crate::db::migrations::run_migrations(&conn).unwrap();

        let (artist_id, _) = crate::repositories::artist_repository::find_or_create(&conn, "Queen").unwrap();
        let (album_id, _) = crate::repositories::album_repository::find_or_create(&conn, "Downloads", artist_id).unwrap();

        let local_path = "downloads/Queen - Bohemian Rhapsody [fJ9rUzIMcZQ].m4a";
        let online_path = "online://youtube/fJ9rUzIMcZQ";
        let now = 1000000;
        let file_size = 5000000;

        // 1. Initial insert
        conn.execute(
            "INSERT INTO songs (title, duration, path, is_favorite, favorite_added_at, track_number, created_at, folder_id, album_id, artist_id, file_modified_at, file_size)
             VALUES (?1, ?2, ?3, 0, NULL, 1, ?4, NULL, ?5, ?6, ?4, ?7)",
            rusqlite::params!["Bohemian Rhapsody", 354, local_path, now, album_id, artist_id, file_size],
        ).unwrap();
        let first_id = conn.last_insert_rowid();

        // 2. Querying row works
        let res = crate::repositories::song_repository::get_by_id(&conn, first_id).unwrap();
        assert_eq!(res.title, "Bohemian Rhapsody");
        assert_eq!(res.artist_name, "Queen");

        // 3. Re-downloading (idempotency check) updates rather than crashing
        let existing_id: Option<i64> = conn.query_row(
            "SELECT id FROM songs WHERE path = ?1 OR path = ?2",
            rusqlite::params![local_path, online_path],
            |r| r.get(0),
        ).ok();

        assert_eq!(existing_id, Some(first_id));

        // Update works without constraint error
        let updated_size = 5200000;
        conn.execute(
            "UPDATE songs 
             SET path = ?1, file_size = ?2, file_modified_at = ?3, album_id = ?4, artist_id = ?5 
             WHERE id = ?6",
            rusqlite::params![local_path, updated_size, now + 10, album_id, artist_id, first_id],
        ).unwrap();

        let res2 = crate::repositories::song_repository::get_by_id(&conn, first_id).unwrap();
        assert_eq!(res2.file_size, updated_size);
    }

    #[test]
    fn test_clean_title_for_lyrics() {
        assert_eq!(clean_title_for_lyrics("Starboy (Official Music Video)"), "Starboy");
        assert_eq!(clean_title_for_lyrics("Blinding Lights [Lyrics Audio HD]"), "Blinding Lights");
        assert_eq!(clean_title_for_lyrics("Shape of You (feat. Stormzy)"), "Shape of You");
        assert_eq!(clean_title_for_lyrics("Comfortably Numb - Remastered"), "Comfortably Numb");
    }
}
