# Focused synthetic checks for backup_helpers.ps1. This never loads backup
# configuration and never connects to a remote host.

Set-StrictMode -Version 2
. (Join-Path $PSScriptRoot 'backup_helpers.ps1')

$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('praynr-backup-test-' + [guid]::NewGuid().ToString('N'))
$junctionPath = $null

function Write-SyntheticGzip {
    param(
        [string]$Path,
        [byte[]]$Payload
    )

    $file = [System.IO.File]::Create($Path)
    $gzip = New-Object System.IO.Compression.GZipStream(
        $file,
        [System.IO.Compression.CompressionMode]::Compress
    )
    try {
        $gzip.Write($Payload, 0, $Payload.Length)
    } finally {
        $gzip.Dispose()
        $file.Dispose()
    }
}

function Assert-Throws {
    param(
        [scriptblock]$Action,
        [string]$Message
    )

    $threw = $false
    try {
        & $Action | Out-Null
    } catch {
        $threw = $true
    }
    if (-not $threw) {
        throw $Message
    }
}

try {
    New-Item -ItemType Directory -Path $testRoot -Force | Out-Null

    $runner = Get-Command pwsh,powershell.exe -ErrorAction Stop | Select-Object -First 1
    $binaryPath = Join-Path $testRoot 'binary.out'
    $binaryCommand = '$b = [byte[]](0,1,127,128,255); [Console]::OpenStandardOutput().Write($b, 0, $b.Length)'
    Copy-ProcessStandardOutputToFile -FileName $runner.Source -Arguments @(
        '-NoProfile', '-NonInteractive', '-Command', $binaryCommand
    ) -OutputPath $binaryPath
    $binary = [System.IO.File]::ReadAllBytes($binaryPath)
    if (($binary -join ',') -ne '0,1,127,128,255') {
        throw 'Raw process output was not byte-preserving.'
    }
    Assert-Throws -Action {
        Copy-ProcessStandardOutputToFile -FileName $runner.Source -Arguments @(
            '-NoProfile', '-NonInteractive', '-Command', 'exit 7'
        ) -OutputPath (Join-Path $testRoot 'failed.out')
    } -Message 'A nonzero native process exit was accepted.'

    $mongoPath = Join-Path $testRoot 'mongo.gz'
    Write-SyntheticGzip -Path $mongoPath -Payload ([byte[]](0, 1, 127, 128, 255))
    [void](Test-GzipArchive -Path $mongoPath)
    $truncatedPath = Join-Path $testRoot 'mongo-truncated.gz'
    $mongoBytes = [System.IO.File]::ReadAllBytes($mongoPath)
    $truncated = $mongoBytes[0..($mongoBytes.Length - 2)]
    [System.IO.File]::WriteAllBytes($truncatedPath, [byte[]]$truncated)
    Assert-Throws -Action { Test-GzipArchive -Path $truncatedPath } -Message 'Truncated gzip was accepted.'
    $corruptPath = Join-Path $testRoot 'mongo-corrupt.gz'
    $corrupt = [System.IO.File]::ReadAllBytes($mongoPath)
    $corrupt[$corrupt.Length - 8] = $corrupt[$corrupt.Length - 8] -bxor 1
    [System.IO.File]::WriteAllBytes($corruptPath, $corrupt)
    Assert-Throws -Action { Test-GzipArchive -Path $corruptPath } -Message 'Corrupt gzip CRC was accepted.'
    $emptyPath = Join-Path $testRoot 'mongo-empty.gz'
    Write-SyntheticGzip -Path $emptyPath -Payload ([byte[]]@())
    Assert-Throws -Action { Test-GzipArchive -Path $emptyPath } -Message 'Empty MongoDB gzip was accepted.'

    $imagesPath = Join-Path $testRoot 'uploads.tar.gz'
    $tarSource = Join-Path $testRoot 'tar source'
    New-Item -ItemType Directory -Path $tarSource -Force | Out-Null
    [System.IO.File]::WriteAllText((Join-Path $tarSource 'proof.txt'), 'proof')
    & tar.exe -czf $imagesPath -C $tarSource .
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to create the synthetic tar archive (tar.exe exit code $LASTEXITCODE)."
    }
    [void](Test-GzipArchive -Path $imagesPath -Tar)
    $invalidTarPath = Join-Path $testRoot 'invalid.tar.gz'
    Write-SyntheticGzip -Path $invalidTarPath -Payload ([byte[]](1, 2, 3, 4, 5))
    Assert-Throws -Action { Test-GzipArchive -Path $invalidTarPath -Tar } -Message 'Invalid tar payload was accepted.'

    $firstRun = New-ExclusiveBackupDirectory -BackupRoot (
        New-Item -ItemType Directory -Path (Join-Path $testRoot 'exclusive') -Force
    )
    $secondRun = New-ExclusiveBackupDirectory -BackupRoot (
        Get-Item -LiteralPath $firstRun.Parent.FullName -Force
    )
    if ([String]::Equals($firstRun.FullName, $secondRun.FullName, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Exclusive backup directory creation reused an existing folder.'
    }

    $backupRoot = Join-Path $testRoot 'retention'
    New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
    for ($number = 1; $number -le 6; $number++) {
        $set = New-Item -ItemType Directory -Path (Join-Path $backupRoot ("verified-$number")) -Force
        Copy-Item -LiteralPath $mongoPath -Destination (Join-Path $set.FullName 'mongo.gz')
        Copy-Item -LiteralPath $imagesPath -Destination (Join-Path $set.FullName 'uploads.tar.gz')
        $markerPath = Join-Path $set.FullName '.backup-complete'
        New-Item -ItemType File -Path $markerPath | Out-Null
        $marker = Get-Item -LiteralPath $markerPath -Force
        $marker.LastWriteTimeUtc = (Get-Date).ToUniversalTime().AddMinutes(-$number)
    }
    $failed = New-Item -ItemType Directory -Path (Join-Path $backupRoot 'failed-run') -Force
    New-Item -ItemType File -Path (Join-Path $failed.FullName 'mongo.gz') | Out-Null
    $legacy = New-Item -ItemType Directory -Path (Join-Path $backupRoot 'legacy-folder') -Force
    New-Item -ItemType File -Path (Join-Path $legacy.FullName 'notes.txt') | Out-Null
    $nested = New-Item -ItemType Directory -Path (Join-Path $legacy.FullName 'nested') -Force
    Assert-Throws -Action {
        Resolve-DirectBackupChild -BackupRoot (Get-Item -LiteralPath $backupRoot -Force) -Candidate $nested
    } -Message 'Retention accepted a non-direct deletion target.'

    $junctionTarget = New-Item -ItemType Directory -Path (Join-Path $testRoot 'junction-target') -Force
    $junctionPath = Join-Path $backupRoot 'unrelated-junction'
    try {
        New-Item -ItemType Junction -Path $junctionPath -Target $junctionTarget.FullName -ErrorAction Stop | Out-Null
    } catch {
        $junctionPath = $null
    }

    $removed = Invoke-BackupRetention -BackupRootPath $backupRoot -Keep 5
    if ($removed -ne 1) {
        throw "Expected one old verified set to be removed, got $removed."
    }
    if (Test-Path -LiteralPath (Join-Path $backupRoot 'verified-6')) {
        throw 'The oldest verified backup set was not removed.'
    }
    if (-not (Test-Path -LiteralPath $failed.FullName) -or
        -not (Test-Path -LiteralPath $legacy.FullName)) {
        throw 'Retention removed an incomplete or legacy folder.'
    }
    if ($null -ne $junctionPath -and -not (Test-Path -LiteralPath $junctionPath -PathType Container)) {
        throw 'Retention removed an unrelated junction.'
    }

    Write-Output 'PASS: raw byte copy, gzip/tar validation, and conservative retention checks.'
} finally {
    if ($null -ne $junctionPath -and (Test-Path -LiteralPath $junctionPath)) {
        Remove-Item -LiteralPath $junctionPath -Force -ErrorAction SilentlyContinue
    }
    $cleanupRoot = Get-Item -LiteralPath $testRoot -Force -ErrorAction SilentlyContinue
    $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\')
    if ($null -ne $cleanupRoot -and
        $cleanupRoot -is [System.IO.DirectoryInfo] -and
        ($cleanupRoot.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0 -and
        [String]::Equals(
            ([System.IO.Directory]::GetParent($cleanupRoot.FullName).FullName).TrimEnd('\'),
            $tempRoot,
            [StringComparison]::OrdinalIgnoreCase
        ) -and
        (Test-NoReparsePoints -Directory $cleanupRoot -Recurse)) {
        Remove-Item -LiteralPath $cleanupRoot.FullName -Recurse -Force
    }
}
