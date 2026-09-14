use std::path::Path;
use lofty::config::WriteOptions;
use lofty::prelude::*;
use lofty::probe::Probe;
use lofty::tag::{ItemKey, Tag};
use lofty::picture::{Picture, PictureType, MimeType};

pub fn embed_metadata(
    path: &Path,
    title: &str,
    artist: &str,
    album: Option<&str>,
    year: Option<u32>,
    lyrics: Option<&str>,
    cover_bytes: Option<&[u8]>,
) -> Result<(), String> {
    if !path.exists() {
        return Err(format!("Audio file does not exist: {:?}", path));
    }

    let mut tagged_file = Probe::open(path)
        .map_err(|e| format!("Failed to probe audio file: {}", e))?
        .read()
        .map_err(|e| format!("Failed to read audio tags: {}", e))?;

    let tag_type = tagged_file.primary_tag_type();
    
    // Get existing primary tag or insert a new one
    let tag = if tagged_file.primary_tag_mut().is_some() {
        tagged_file.primary_tag_mut().unwrap()
    } else {
        tagged_file.insert_tag(Tag::new(tag_type));
        tagged_file.primary_tag_mut().unwrap()
    };

    tag.set_title(title.to_string());
    tag.set_artist(artist.to_string());

    if let Some(alb) = album {
        tag.set_album(alb.to_string());
    }

    if let Some(y) = year {
        tag.insert_text(ItemKey::Year, y.to_string());
    }

    if let Some(lyr) = lyrics {
        tag.insert_text(ItemKey::Lyrics, lyr.to_string());
    }

    if let Some(bytes) = cover_bytes {
        if !bytes.is_empty() {
            let picture = Picture::unchecked(bytes.to_vec())
                .pic_type(PictureType::CoverFront)
                .mime_type(MimeType::Jpeg)
                .build();
            tag.push_picture(picture);
        }
    }

    tag.save_to_path(path, WriteOptions::default())
        .map_err(|e| format!("Failed to save audio tags to {:?}: {}", path, e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_embed_metadata_nonexistent_file() {
        let path = Path::new("nonexistent_file_12345.mp3");
        let result = embed_metadata(path, "Title", "Artist", None, None, None, None);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("does not exist"));
    }
}

