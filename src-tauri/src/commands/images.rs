use std::{
    fs,
    path::{Component, Path, PathBuf},
};

use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine};
use tauri::{AppHandle, Manager};

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|err| format!("Failed to resolve data directory: {err}"))
}

fn sanitize_segment(value: &str) -> String {
    let mut sanitized = value
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.') {
                ch
            } else {
                '-'
            }
        })
        .collect::<String>();

    if sanitized.trim_matches('-').is_empty() {
        sanitized = "file".into();
    }

    sanitized
}

fn ensure_safe_relative(path: &Path) -> Result<(), String> {
    for component in path.components() {
        match component {
            Component::Normal(_) => continue,
            Component::CurDir => continue,
            _ => {
                return Err("Unsafe path".to_string());
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn save_image(
    app: AppHandle,
    session_id: String,
    category: String,
    filename: String,
    data: Vec<u8>,
) -> Result<String, String> {
    let mut base_dir = data_dir(&app)?;
    base_dir.push("images");
    base_dir.push(sanitize_segment(&category));
    base_dir.push(&session_id);
    fs::create_dir_all(&base_dir)
        .map_err(|err| format!("Failed to create directory {:?}: {err}", base_dir))?;

    let final_name = sanitize_segment(&filename);
    let mut absolute_path = base_dir.clone();
    absolute_path.push(&final_name);

    fs::write(&absolute_path, data)
        .map_err(|err| format!("Failed to write file {:?}: {err}", absolute_path))?;

    let mut relative_path = PathBuf::from("images");
    relative_path.push(sanitize_segment(&category));
    relative_path.push(&session_id);
    relative_path.push(final_name);

    Ok(relative_path.to_string_lossy().replace('\\', "/"))
}

#[tauri::command]
pub async fn delete_session_images(app: AppHandle, session_id: String) -> Result<(), String> {
    let mut images_root = data_dir(&app)?;
    images_root.push("images");

    if !images_root.exists() {
        return Ok(());
    }

    for category in fs::read_dir(&images_root)
        .map_err(|err| format!("Failed to read {:?}: {err}", images_root))?
    {
        let category = category.map_err(|err| err.to_string())?.path();
        if !category.is_dir() {
            continue;
        }
        let candidate = category.join(&session_id);
        if candidate.exists() {
            fs::remove_dir_all(&candidate)
                .map_err(|err| format!("Failed to delete {:?}: {err}", candidate))?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn get_image_base64(app: AppHandle, relative_path: String) -> Result<String, String> {
    let mut base_dir = data_dir(&app)?;
    let trimmed = relative_path.trim_start_matches(['/', '\\']);
    let relative = PathBuf::from(trimmed);
    ensure_safe_relative(&relative)?;

    base_dir.push(relative);
    let bytes = fs::read(&base_dir)
        .map_err(|err| format!("Failed to read file {:?}: {err}", base_dir))?;
    Ok(BASE64_STANDARD.encode(bytes))
}
