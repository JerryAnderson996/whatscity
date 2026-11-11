# Server HTTP Locale per WhatsCity PWA (PowerShell Nativo, Zero Dipendenze)
param(
    [int]$Port = 8080
)

$Root = $PSScriptRoot
$Listener = New-Object System.Net.HttpListener
$Prefix = "http://localhost:$Port/"
$Listener.Prefixes.Add($Prefix)
$Listener.Start()

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  WhatsCity PWA attiva su: $Prefix" -ForegroundColor Green
Write-Host "  Directory: $Root" -ForegroundColor Gray
Write-Host "  Premi Ctrl+C per arrestare il server." -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan

$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
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

        $UrlPath = $Request.Url.LocalPath.TrimStart('/')
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
