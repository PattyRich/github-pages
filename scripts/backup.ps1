# OSRS Bingo - Remote MongoDB + Upload Images Backup Script
# This script streams a gzipped mongodump and uploads tar from the remote server
# into a single timestamped folder on local storage.

# Configuration (Loaded from backup_config.ps1)
# $SERVER_HOST       - The IP address of your server
# $SERVER_USER       - The SSH username (usually 'ubuntu')
# $PEM_PATH          - Path to your .pem private key
# $LOCAL_BACKUP_DIR  - Local folder where backups will be saved

$ConfigPath = Join-Path $PSScriptRoot "backup_config.ps1"
if (Test-Path $ConfigPath) {
    . $ConfigPath
} else {
    Write-Error "CRITICAL: backup_config.ps1 not found! Please create it based on the README instructions."
    exit 1
}

# Each run gets its own timestamped folder
$DATE       = Get-Date -Format "yyyy-MM-dd_HHmm"
$BackupDir  = Join-Path $LOCAL_BACKUP_DIR $DATE
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$MongoFile  = Join-Path $BackupDir "mongo.gz"
$ImagesFile = Join-Path $BackupDir "uploads.tar.gz"

Write-Host "--- Starting Remote Backup ---" -ForegroundColor Cyan
Write-Host "Folder: $BackupDir"

# --- 1. MongoDB dump ---
Write-Host "`n[1/2] MongoDB..." -ForegroundColor Cyan
$MongoCmd = 'docker exec $(docker ps -qf name=mongo) mongodump --archive --gzip'
ssh -i "$PEM_PATH" -o StrictHostKeyChecking=accept-new "${SERVER_USER}@${SERVER_HOST}" $MongoCmd > "$MongoFile"

if ($LASTEXITCODE -eq 0) {
    $SIZE = [Math]::Round((Get-Item $MongoFile).Length / 1KB, 2)
    Write-Host "[SUCCESS] mongo.gz ($SIZE KB)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] MongoDB backup failed!" -ForegroundColor Red
    if (Test-Path $MongoFile) { Remove-Item $MongoFile }
}

# --- 2. Upload images (proof + board-images) ---
Write-Host "`n[2/2] Upload images..." -ForegroundColor Cyan
$SshArgs = "-i `"$PEM_PATH`" `"${SERVER_USER}@${SERVER_HOST}`" docker exec `$(docker ps -qf name=api) tar czf - -C /app/static/uploads ."
cmd /c "ssh $SshArgs > `"$ImagesFile`""

if ($LASTEXITCODE -eq 0) {
    $SIZE = [Math]::Round((Get-Item $ImagesFile).Length / 1KB, 2)
    Write-Host "[SUCCESS] uploads.tar.gz ($SIZE KB)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Image backup failed!" -ForegroundColor Red
    if (Test-Path $ImagesFile) { Remove-Item $ImagesFile }
}

# Cleanup: keep only the 5 most recent backup folders
$AllBackups = Get-ChildItem -Path $LOCAL_BACKUP_DIR -Directory | Sort-Object CreationTime -Descending
if ($AllBackups.Count -gt 5) {
    $OldBackups = $AllBackups[5..($AllBackups.Count - 1)]
    $OldBackups | Remove-Item -Recurse -Force
    Write-Host "`nCleaned up $($OldBackups.Count) old backup folder(s)." -ForegroundColor Yellow
}

Write-Host "`n-----------------------------"
