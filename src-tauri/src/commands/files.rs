use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn get_data_dir(app: AppHandle) -> Result<String, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|err| format!("Failed to resolve data directory: {err}"))?;
    Ok(path.to_string_lossy().into_owned())
}
