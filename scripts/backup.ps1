# OSRS Bingo - Remote MongoDB + Upload Images Backup Script
# This script streams a gzipped mongodump and uploads tar from the remote server
# into a single timestamped folder on local storage.
#
# Run from Git Bash at the repository root:
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./scripts/backup.ps1

. (Join-Path $PSScriptRoot "backup_helpers.ps1")

# Configuration (Loaded from backup_config.ps1)
# $SERVER_HOST       - The IP address of your server
# $SERVER_USER       - The SSH username (usually 'ubuntu')
# $PEM_PATH          - Path to your .pem private key
# $LOCAL_BACKUP_DIR  - Local folder where backups will be saved

$ConfigPath = Join-Path $PSScriptRoot "backup_config.ps1"
try {
    if (Test-Path -LiteralPath $ConfigPath -PathType Leaf) {
        . $ConfigPath
    } else {
        throw 'backup_config.ps1 not found. Create it based on the README instructions.'
    }

    foreach ($name in @('LOCAL_BACKUP_DIR', 'SERVER_HOST', 'SERVER_USER', 'PEM_PATH')) {
        $variable = Get-Variable -Name $name -ErrorAction SilentlyContinue
        if ($null -eq $variable -or [String]::IsNullOrWhiteSpace([string]$variable.Value)) {
            throw "backup_config.ps1 must define a non-empty $name."
        }
    }

    $backupRoot = Get-Item -LiteralPath ([string]$LOCAL_BACKUP_DIR) -Force -ErrorAction SilentlyContinue
    if ($null -eq $backupRoot) {
        $backupRoot = [System.IO.Directory]::CreateDirectory([string]$LOCAL_BACKUP_DIR)
    }
    if (-not ($backupRoot -is [System.IO.DirectoryInfo])) {
        throw "Backup root '$LOCAL_BACKUP_DIR' is not a directory."
    }
    if (-not (Test-NoReparsePoints -Directory $backupRoot)) {
        throw "Backup root '$($backupRoot.FullName)' is a reparse point."
    }

    # Fail before contacting the server when local archive validators are not
    # available. gzip.exe is provided by Git for Windows; tar.exe ships with
    # current Windows releases.
    [void](Resolve-NativeValidator -Name 'gzip.exe')
    [void](Resolve-NativeValidator -Name 'tar.exe')

    # Each run gets a unique folder. Creation is exclusive so a retry can
    # never reopen a completed or partially written folder.
    $BackupDir = New-ExclusiveBackupDirectory -BackupRoot $backupRoot
    $MongoFile = Join-Path $BackupDir.FullName 'mongo.gz'
    $ImagesFile = Join-Path $BackupDir.FullName 'uploads.tar.gz'

    Write-Host '--- Starting Remote Backup ---' -ForegroundColor Cyan
    Write-Host "Folder: $($BackupDir.FullName)"

    # --- 1. MongoDB dump ---
    Write-Host "`n[1/2] MongoDB..." -ForegroundColor Cyan
    $MongoCmd = 'docker exec $(docker ps -qf name=mongo) mongodump --archive --gzip'
    Copy-ProcessStandardOutputToFile -FileName 'ssh.exe' -Arguments @(
        '-i', [string]$PEM_PATH,
        '-o', 'StrictHostKeyChecking=accept-new',
        ("$SERVER_USER@$SERVER_HOST"),
        $MongoCmd
    ) -OutputPath $MongoFile
    [void](Test-GzipArchive -Path $MongoFile)
    $size = [Math]::Round((Get-Item -LiteralPath $MongoFile).Length / 1KB, 2)
    Write-Host "[SUCCESS] mongo.gz ($size KB)" -ForegroundColor Green

    # --- 2. Upload images (proof + board-images) ---
    Write-Host "`n[2/2] Upload images..." -ForegroundColor Cyan
    $ImagesCmd = 'docker exec $(docker ps -qf name=api) tar czf - -C /app/static/uploads .'
    Copy-ProcessStandardOutputToFile -FileName 'ssh.exe' -Arguments @(
        '-i', [string]$PEM_PATH,
        '-o', 'StrictHostKeyChecking=accept-new',
        ("$SERVER_USER@$SERVER_HOST"),
        $ImagesCmd
    ) -OutputPath $ImagesFile
    [void](Test-GzipArchive -Path $ImagesFile -Tar)
    $size = [Math]::Round((Get-Item -LiteralPath $ImagesFile).Length / 1KB, 2)
    Write-Host "[SUCCESS] uploads.tar.gz ($size KB)" -ForegroundColor Green

    # Retention only considers sets that have both validated archives and the
    # completion marker. This marker is created only after both transfers pass.
    $marker = Join-Path $BackupDir.FullName '.backup-complete'
    $markerStream = $null
    try {
        $markerStream = [System.IO.File]::Open(
            $marker,
            [System.IO.FileMode]::CreateNew,
            [System.IO.FileAccess]::Write,
            [System.IO.FileShare]::None
        )
    } finally {
        if ($null -ne $markerStream) {
            $markerStream.Dispose()
        }
    }
} catch {
    Write-Error "BACKUP FAILED: $($_.Exception.Message)"
    Write-Error 'The current backup set was not marked complete; retention cleanup was skipped.'
    exit 1
}

try {
    $removed = Invoke-BackupRetention -BackupRootPath $backupRoot.FullName -Keep 5
    if ($removed -gt 0) {
        Write-Host "`nCleaned up $removed verified backup folder(s)." -ForegroundColor Yellow
    }
} catch {
    Write-Error "BACKUP COMPLETED BUT RETENTION CLEANUP FAILED: $($_.Exception.Message)"
    exit 2
}

Write-Host "`n-----------------------------"
exit 0
