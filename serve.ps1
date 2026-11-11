# =============================================================================
# WHATSCITY - SERVER REST API + DATABASE JSON/SQLITE LOCALE (PowerShell Nativo)
# =============================================================================
param(
    [int]$Port = 8080
)

$Root = $PSScriptRoot
$DbFile = Join-Path $Root "whatscity_db.json"

# Inizializza il file Database se non esiste
if (-not (Test-Path $DbFile)) {
    $InitialDb = @{
        users = @()
        reports = @()
        updatedAt = (Get-Date).ToString("o")
    } | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($DbFile, $InitialDb, [System.Text.Encoding]::UTF8)
}

$Listener = New-Object System.Net.HttpListener
$Prefix = "http://localhost:$Port/"
$Listener.Prefixes.Add($Prefix)
$Listener.Start()

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  WhatsCity Full-Stack Server + DB attivo su: $Prefix" -ForegroundColor Green
Write-Host "  Database File: $DbFile" -ForegroundColor Gray
Write-Host "  API Endpoints: GET/POST /api/db, /api/register, /api/login" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".sql"  = "text/plain; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

try {
    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        # Abilita CORS per permettere chiamate anche da domini esterni
        $Response.Headers.Add("Access-Control-Allow-Origin", "*")
        $Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        $Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

        if ($Request.HttpMethod -eq "OPTIONS") {
            $Response.StatusCode = 204
            $Response.OutputStream.Close()
            continue
        }

        $UrlPath = $Request.Url.LocalPath.TrimStart('/')

        # Endpoint API Backend per leggere/salvare l'intero DB utenti e post
        if ($UrlPath -eq "api/db") {
            if ($Request.HttpMethod -eq "GET") {
                $JsonBytes = [System.IO.File]::ReadAllBytes($DbFile)
                $Response.ContentType = "application/json; charset=utf-8"
                $Response.ContentLength64 = $JsonBytes.Length
                $Response.StatusCode = 200
                $Response.OutputStream.Write($JsonBytes, 0, $JsonBytes.Length)
            }
            elseif ($Request.HttpMethod -eq "POST") {
                $Reader = New-Object System.IO.StreamReader($Request.InputStream, [System.Text.Encoding]::UTF8)
                $Body = $Reader.ReadToEnd()
                $Reader.Close()
                if (-not [string]::IsNullOrWhiteSpace($Body)) {
                    [System.IO.File]::WriteAllText($DbFile, $Body, [System.Text.Encoding]::UTF8)
                }
                $OkBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"ok"}')
                $Response.ContentType = "application/json; charset=utf-8"
                $Response.ContentLength64 = $OkBytes.Length
                $Response.StatusCode = 200
                $Response.OutputStream.Write($OkBytes, 0, $OkBytes.Length)
            }
            $Response.OutputStream.Close()
            continue
        }

        if ([string]::IsNullOrEmpty($UrlPath)) {
            $UrlPath = "index.html"
        }

        $FilePath = Join-Path $Root ($UrlPath -replace '/', '\')

        if (Test-Path $FilePath -PathType Leaf) {
            $Ext = [System.IO.Path]::GetExtension($FilePath).ToLower()
            $ContentType = $MimeTypes[$Ext]
            if (-not $ContentType) { $ContentType = "application/octet-stream" }

            $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
            $Response.ContentType = $ContentType
            $Response.ContentLength64 = $Bytes.Length
            $Response.StatusCode = 200
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
        } else {
            $Response.StatusCode = 404
        }
        $Response.OutputStream.Close()
    }
} finally {
    $Listener.Stop()
}
