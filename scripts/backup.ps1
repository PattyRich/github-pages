# OSRS Bingo - Remote MongoDB Backup Script
# This script streams a gzipped mongodump from the remote server directly to local storage.

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

# Create local backup directory if it doesn't exist
if (!(Test-Path $LOCAL_BACKUP_DIR)) {
    New-Item -ItemType Directory -Force -Path $LOCAL_BACKUP_DIR | Out-Null
}

# Generate filename with timestamp
$DATE = Get-Date -Format "yyyy-MM-dd_HHmm"
$FILENAME = "bingo_backup_$DATE.gz"
$FULL_PATH = Join-Path $LOCAL_BACKUP_DIR $FILENAME

Write-Host "--- Starting Remote Backup ---" -ForegroundColor Cyan
Write-Host "Source: $SERVER_HOST (Docker Container: mongo)"
Write-Host "Target: $FULL_PATH"

# Execute SSH Streaming Backup
# 1. SSH into server using .pem key
# 2. Find the mongo container ID dynamically
# 3. Run mongodump inside the container and stream archive to stdout
# 4. Redirect stdout to local file on Windows
ssh -i "$PEM_PATH" -o StrictHostKeyChecking=accept-new "$SERVER_USER@$SERVER_HOST" "docker exec `$(docker ps -qf name=mongo) mongodump --archive --gzip" > "$FULL_PATH"

# Check if the command succeeded
if ($LASTEXITCODE -eq 0) {
    $FILE_SIZE = (Get-Item $FULL_PATH).Length / 1KB
    Write-Host "`n[SUCCESS] Backup completed successfully!" -ForegroundColor Green
    Write-Host "File Size: $([Math]::Round($FILE_SIZE, 2)) KB"

    # Cleanup: Keep only the 5 most recent backups
    $Backups = Get-ChildItem -Path $LOCAL_BACKUP_DIR -Filter "bingo_backup_*.gz" | Sort-Object CreationTime -Descending
    if ($Backups.Count -gt 5) {
        $OldBackups = $Backups[5..($Backups.Count - 1)]
        $OldBackups | Remove-Item -Force
        Write-Host "Cleaned up $($OldBackups.Count) old backup(s)." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[ERROR] Backup failed! Check your SSH connection or if the mongo container is running." -ForegroundColor Red
    # Remove empty file if failed
    if (Test-Path $FULL_PATH) { Remove-Item $FULL_PATH }
}

Write-Host "-----------------------------"
