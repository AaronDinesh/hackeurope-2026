use std::path::PathBuf;

use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn get_data_dir(app: AppHandle) -> Result<String, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|err| format!("Failed to resolve data directory: {err}"))?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
pub async fn write_binary_file(path: String, data: Vec<u8>) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("File path is empty".into());
    }

    let normalized = if path.starts_with("file://") {
        path.trim_start_matches("file://").to_string()
    } else {
        path
    };

    let file_path = PathBuf::from(normalized);
    if let Some(parent) = file_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|err| format!("Failed to create parent directory: {err}"))?;
    }

    std::fs::write(&file_path, data)
        .map_err(|err| format!("Failed to write file {:?}: {err}", file_path))?;
    Ok(())
}
