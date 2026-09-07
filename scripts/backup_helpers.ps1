# Helpers for scripts/backup.ps1. These functions are compatible with Windows
# PowerShell 5.1 and do not load backup configuration or secrets.

function ConvertTo-WindowsCommandLineArgument {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Value
    )

    if ($Value.Length -eq 0) {
        return '""'
    }

    # ProcessStartInfo.Arguments is the only argument API on Windows
    # PowerShell 5.1. Quote according to CommandLineToArgvW rules so paths
    # containing spaces, quotes, or trailing backslashes remain one argument.
    if ($Value -notmatch '[\s"]') {
        return $Value
    }

    $builder = New-Object System.Text.StringBuilder
    [void]$builder.Append('"')
    $backslashes = 0
    foreach ($character in $Value.ToCharArray()) {
        if ($character -eq '\') {
            $backslashes++
            continue
        }

        if ($character -eq '"') {
            [void]$builder.Append(('\' * (($backslashes * 2) + 1)))
            [void]$builder.Append('"')
            $backslashes = 0
            continue
        }

        if ($backslashes -gt 0) {
            [void]$builder.Append(('\' * $backslashes))
            $backslashes = 0
        }
        [void]$builder.Append($character)
    }

    if ($backslashes -gt 0) {
        [void]$builder.Append(('\' * ($backslashes * 2)))
    }
    [void]$builder.Append('"')
    return $builder.ToString()
}

function Copy-ProcessStandardOutputToFile {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$FileName,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [Parameter(Mandatory = $true)]
        [string]$OutputPath
    )

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $FileName
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    # Leave stderr attached to the invoking process. This avoids a pipe
    # deadlock while stdout is being copied and keeps ssh diagnostics visible.
    $startInfo.RedirectStandardError = $false

    $argumentListProperty = $startInfo.GetType().GetProperty('ArgumentList')
    if ($null -ne $argumentListProperty) {
        $argumentList = $argumentListProperty.GetValue($startInfo, $null)
        foreach ($argument in $Arguments) {
            [void]$argumentList.Add([string]$argument)
        }
    } else {
        $quotedArguments = foreach ($argument in $Arguments) {
            ConvertTo-WindowsCommandLineArgument -Value ([string]$argument)
        }
        $startInfo.Arguments = $quotedArguments -join ' '
    }

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    $outputStream = $null
    $fileStream = $null
    try {
        if (-not $process.Start()) {
            throw "Unable to start '$FileName'."
        }

        $outputStream = $process.StandardOutput.BaseStream
        $fileStream = New-Object System.IO.FileStream(
            $OutputPath,
            [System.IO.FileMode]::Create,
            [System.IO.FileAccess]::Write,
            [System.IO.FileShare]::None
        )
        # Copy the native byte stream directly. Do not use PowerShell's
        # redirection operators: Windows PowerShell can transcode binary data.
        $outputStream.CopyTo($fileStream)
        $fileStream.Flush()
        $process.WaitForExit()

        if ($process.ExitCode -ne 0) {
            throw "'$FileName' exited with code $($process.ExitCode)."
        }
    } finally {
        if ($null -ne $fileStream) {
            $fileStream.Dispose()
        }
        if ($null -ne $outputStream) {
            $outputStream.Dispose()
        }
        if ($null -ne $process) {
            $process.Dispose()
        }
    }
}

function Resolve-NativeValidator {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    $command = Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($null -ne $command) {
        return $command.Source
    }

    # Git for Windows installs gzip.exe under usr\bin but that directory is
    # not always added to the Windows PATH when this script runs from Task
    # Scheduler.
    if ($Name -eq 'gzip.exe') {
        $candidates = @()
        foreach ($programFiles in @(${env:ProgramFiles}, ${env:ProgramFiles(x86)})) {
            if (-not [String]::IsNullOrWhiteSpace([string]$programFiles)) {
                $candidates += Join-Path $programFiles 'Git\usr\bin\gzip.exe'
            }
        }
        foreach ($candidate in $candidates) {
            if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
                return (Get-Item -LiteralPath $candidate -Force).FullName
            }
        }
    }

    throw "$Name is required to validate backup archives. Install Git for Windows or add $Name to PATH."
}

function Invoke-NativeCommandForValidation {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$FileName,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    # Validators write text only. Discarding their stdout/stderr cannot corrupt
    # a backup stream because the stream is copied by Copy-Process... above.
    & $FileName @Arguments > $null 2> $null
    return [int]$LASTEXITCODE
}

function Test-GzipArchive {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [switch]$Tar
    )

    $file = Get-Item -LiteralPath $Path -Force -ErrorAction Stop
    if ($file.PSIsContainer -or $file.Length -lt 18) {
        throw "'$Path' is missing or too small to be a gzip archive."
    }

    $gzipCommand = Resolve-NativeValidator -Name 'gzip.exe'
    $gzipExitCode = Invoke-NativeCommandForValidation -FileName $gzipCommand -Arguments @(
        '--test',
        '--',
        $file.FullName
    )
    if ($gzipExitCode -ne 0) {
        throw "'$Path' failed gzip validation (gzip.exe exit code $gzipExitCode)."
    }

    if (-not $Tar) {
        # mongodump must contain data. Read only the first payload byte here;
        # gzip.exe above has already performed the full integrity check.
        $inputStream = $null
        $gzipStream = $null
        try {
            $inputStream = [System.IO.File]::OpenRead($file.FullName)
            $gzipStream = New-Object System.IO.Compression.GZipStream(
                $inputStream,
                [System.IO.Compression.CompressionMode]::Decompress
            )
            $firstByte = New-Object byte[] 1
            if ($gzipStream.Read($firstByte, 0, 1) -le 0) {
                throw "'$Path' is a valid gzip stream with an empty payload."
            }
        } finally {
            if ($null -ne $gzipStream) {
                $gzipStream.Dispose()
            }
            if ($null -ne $inputStream) {
                $inputStream.Dispose()
            }
        }
    }

    if ($Tar) {
        $tarCommand = Resolve-NativeValidator -Name 'tar.exe'
        $tarExitCode = Invoke-NativeCommandForValidation -FileName $tarCommand -Arguments @(
            '-tzf',
            $file.FullName
        )
        if ($tarExitCode -ne 0) {
            throw "'$Path' failed tar archive validation (tar.exe exit code $tarExitCode)."
        }
    }
    return $true
}

function Test-NoReparsePoints {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.DirectoryInfo]$Directory,

        [switch]$Recurse
    )

    if (($Directory.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
        return $false
    }
    if (-not $Recurse) {
        return $true
    }

    $pending = New-Object 'System.Collections.Generic.Stack[System.IO.DirectoryInfo]'
    $pending.Push($Directory)
    while ($pending.Count -gt 0) {
        $current = $pending.Pop()
        foreach ($entry in $current.EnumerateFileSystemInfos('*', [System.IO.SearchOption]::TopDirectoryOnly)) {
            if (($entry.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
                return $false
            }
            if ($entry -is [System.IO.DirectoryInfo]) {
                $pending.Push([System.IO.DirectoryInfo]$entry)
            }
        }
    }
    return $true
}

function Resolve-DirectBackupChild {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.DirectoryInfo]$BackupRoot,

        [Parameter(Mandatory = $true)]
        [System.IO.DirectoryInfo]$Candidate
    )

    $rootPath = [System.IO.Path]::GetFullPath($BackupRoot.FullName)
    $rootName = [System.IO.Path]::GetPathRoot($rootPath)
    if ($rootPath.Length -gt $rootName.Length) {
        $rootPath = $rootPath.TrimEnd('\')
    }
    $candidatePath = [System.IO.Path]::GetFullPath($Candidate.FullName)
    $candidateParentInfo = [System.IO.Directory]::GetParent($candidatePath)
    if ($null -eq $candidateParentInfo) {
        throw "Refusing to delete '$candidatePath': it has no parent directory."
    }
    $candidateParent = [System.IO.Path]::GetFullPath($candidateParentInfo.FullName)
    if ($candidateParent.Length -gt $rootName.Length) {
        $candidateParent = $candidateParent.TrimEnd('\')
    }
    if (-not [String]::Equals($candidateParent, $rootPath, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to delete '$candidatePath': it is not a direct child of '$rootPath'."
    }
    if ([String]::Equals($candidatePath, $rootPath, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to delete the backup root '$rootPath'."
    }

    # Inspect the literal child before resolving anything. A reparse point is
    # never an eligible deletion target, even if it points back under root.
    $resolvedCandidate = Get-Item -LiteralPath $candidatePath -Force -ErrorAction Stop
    if (-not ($resolvedCandidate -is [System.IO.DirectoryInfo])) {
        throw "Refusing to delete '$candidatePath': it is not a directory."
    }
    if (($resolvedCandidate.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
        throw "Refusing to delete '$candidatePath': it is a reparse point."
    }
    return $resolvedCandidate
}

function Test-VerifiedBackupSet {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.DirectoryInfo]$Directory
    )

    try {
        if (-not (Test-NoReparsePoints -Directory $Directory -Recurse)) {
            return $false
        }
        $marker = Join-Path $Directory.FullName '.backup-complete'
        $mongoPath = Join-Path $Directory.FullName 'mongo.gz'
        $imagesPath = Join-Path $Directory.FullName 'uploads.tar.gz'
        if (-not (Test-Path -LiteralPath $marker -PathType Leaf)) {
            return $false
        }
        [void](Test-GzipArchive -Path $mongoPath)
        [void](Test-GzipArchive -Path $imagesPath -Tar)
        return $true
    } catch {
        return $false
    }
}

function New-ExclusiveBackupDirectory {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.DirectoryInfo]$BackupRoot
    )

    $stamp = Get-Date -Format 'yyyy-MM-dd_HHmmss_fff'
    for ($attempt = 0; $attempt -lt 10; $attempt++) {
        $suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
        $name = "$stamp-$suffix"
        $candidatePath = Join-Path $BackupRoot.FullName $name
        try {
            return New-Item -ItemType Directory -Path $candidatePath -ErrorAction Stop
        } catch {
            # A collision is harmless; any other failure must be surfaced.
            if (-not (Test-Path -LiteralPath $candidatePath -PathType Container)) {
                throw
            }
        }
    }
    throw "Unable to create a unique backup folder under '$($BackupRoot.FullName)'."
}

function Invoke-BackupRetention {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$BackupRootPath,

        [int]$Keep = 5
    )

    if ($Keep -lt 1) {
        throw 'Retention count must be at least 1.'
    }

    $root = Get-Item -LiteralPath $BackupRootPath -Force -ErrorAction Stop
    if (-not ($root -is [System.IO.DirectoryInfo])) {
        throw "Backup root '$BackupRootPath' is not a directory."
    }
    # Only the configured root itself is checked here. A junction in an
    # unrelated legacy child must be preserved, not make all cleanup fail.
    if (-not (Test-NoReparsePoints -Directory $root)) {
        throw "Refusing retention cleanup under reparse-point backup root '$($root.FullName)'."
    }

    $verified = @()
    foreach ($child in @(Get-ChildItem -LiteralPath $root.FullName -Directory -Force -ErrorAction Stop)) {
        if (Test-VerifiedBackupSet -Directory $child) {
            $verified += $child
        }
    }
    $verified = @($verified | Sort-Object -Property @{
        Expression = {
            (Get-Item -LiteralPath (Join-Path $_.FullName '.backup-complete') -Force -ErrorAction Stop).LastWriteTimeUtc
        }
        Descending = $true
    })
    if ($verified.Count -le $Keep) {
        return 0
    }

    $removed = 0
    foreach ($candidate in @($verified | Select-Object -Skip $Keep)) {
        $safeCandidate = Resolve-DirectBackupChild -BackupRoot $root -Candidate $candidate
        if (-not (Test-NoReparsePoints -Directory $safeCandidate -Recurse)) {
            Write-Warning "Preserving '$($safeCandidate.FullName)': it contains a reparse point."
            continue
        }
        Remove-Item -LiteralPath $safeCandidate.FullName -Recurse -Force -ErrorAction Stop
        $removed++
    }
    return $removed
}
