param(
  [string]$Source = "images\\savethedate.png",
  [string]$Output = "images\\save-date.png"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $Source)) {
  throw "Source not found: $Source"
}

$bmp = [System.Drawing.Bitmap]::new($Source)
try {
  $w = $bmp.Width
  $h = $bmp.Height

  # 1) Detect the strongest horizontal band of dark strokes (wordmark)
  $stepX = 3
  $thresholdLum = 175
  $rowCounts = New-Object int[] $h
  for ($y = 0; $y -lt $h; $y++) {
    $count = 0
    for ($x = 0; $x -lt $w; $x += $stepX) {
      $p = $bmp.GetPixel($x, $y)
      $lum = [int](0.2126 * $p.R + 0.7152 * $p.G + 0.0722 * $p.B)
      if ($lum -lt $thresholdLum) { $count++ }
    }
    $rowCounts[$y] = $count
  }

  $minCount = [Math]::Max(12, [int](($w / $stepX) * 0.01))
  $runs = New-Object System.Collections.Generic.List[object]
  $inRun = $false
  $start = 0
  $sum = 0

  for ($y = 0; $y -lt $h; $y++) {
    if ($rowCounts[$y] -ge $minCount) {
      if (-not $inRun) { $inRun = $true; $start = $y; $sum = 0 }
      $sum += $rowCounts[$y]
    }
    elseif ($inRun) {
      $runs.Add([pscustomobject]@{ start = $start; end = ($y - 1); sum = $sum })
      $inRun = $false
    }
  }
  if ($inRun) {
    $runs.Add([pscustomobject]@{ start = $start; end = ($h - 1); sum = $sum })
  }

  $maxStart = [int]($h * 0.65)
  $cand = $runs | Where-Object { $_.start -lt $maxStart } | Sort-Object sum -Descending | Select-Object -First 1
  if (-not $cand) { throw 'No wordmark band detected.' }

  $yStart = [int]$cand.start
  $yEnd = [int]$cand.end
  $padYBand = 30
  $yy0 = [Math]::Max(0, $yStart - $padYBand)
  $yy1 = [Math]::Min($h - 1, $yEnd + $padYBand)

  # 2) Tight bbox using "gray ink" predicate + density thresholds (ignore edge noise)
  $lumKeep = 205
  $chromaKeep = 22
  $colCounts = New-Object int[] $w
  $rowCounts2 = New-Object int[] ($yy1 - $yy0 + 1)

  for ($y = $yy0; $y -le $yy1; $y++) {
    $ry = $y - $yy0
    $rc = 0
    for ($x = 0; $x -lt $w; $x++) {
      $p = $bmp.GetPixel($x, $y)
      $r = [int]$p.R; $g = [int]$p.G; $b = [int]$p.B
      $lum = [int](0.2126 * $r + 0.7152 * $g + 0.0722 * $b)
      $mx = [Math]::Max($r, [Math]::Max($g, $b))
      $mn = [Math]::Min($r, [Math]::Min($g, $b))
      $chroma = $mx - $mn

      if ($lum -lt $lumKeep -and $chroma -le $chromaKeep) {
        $colCounts[$x]++
        $rc++
      }
    }
    $rowCounts2[$ry] = $rc
  }

  $minColCount = 6
  $minRowCount = 18

  $minX = 0
  while ($minX -lt $w -and $colCounts[$minX] -lt $minColCount) { $minX++ }
  $maxX = $w - 1
  while ($maxX -ge 0 -and $colCounts[$maxX] -lt $minColCount) { $maxX-- }

  $minY = 0
  while ($minY -lt $rowCounts2.Length -and $rowCounts2[$minY] -lt $minRowCount) { $minY++ }
  $maxY = $rowCounts2.Length - 1
  while ($maxY -ge 0 -and $rowCounts2[$maxY] -lt $minRowCount) { $maxY-- }

  if ($minX -ge $maxX -or $minY -ge $maxY) {
    throw 'Failed to derive a dense ink bbox.'
  }

  $padX = 26
  $padY = 18
  $x0 = [Math]::Max(0, $minX - $padX)
  $x1 = [Math]::Min($w - 1, $maxX + $padX)
  $y0 = [Math]::Max(0, ($yy0 + $minY) - $padY)
  $y1 = [Math]::Min($h - 1, ($yy0 + $maxY) + $padY)

  $cropW = $x1 - $x0 + 1
  $cropH = $y1 - $y0 + 1

  # 3) Crop
  $crop = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $gfx = [System.Drawing.Graphics]::FromImage($crop)
  $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $gfx.DrawImage(
    $bmp,
    (New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)),
    (New-Object System.Drawing.Rectangle($x0, $y0, $cropW, $cropH)),
    [System.Drawing.GraphicsUnit]::Pixel
  )
  $gfx.Dispose()

  # 4) Build alpha: remove background by luminance + chroma
  $argb = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  # Background-relative alpha: compare pixel luminance to row's brightest tone.
  # This suppresses gray paper / watercolor haze while keeping dark ink.
  $deltaTransparent = 55
  $deltaOpaque = 140
  # Hard mask: only keep pixels sufficiently darker than background.
  # Increase to remove more background; decrease if you lose thin strokes.
  $deltaHardInk = 95
  # Drop colorful pixels (watercolor/flowers) even if they are darker.
  $chromaCut = 16
  $gamma = 2.0
  $ink = [System.Drawing.Color]::FromArgb(255, 60, 60, 60)

  for ($y = 0; $y -lt $cropH; $y++) {
    # Estimate background luminance for this row as the brightest sampled pixel.
    $rowMaxLum = 0
    for ($sx = 0; $sx -lt $cropW; $sx += 6) {
      $sp = $crop.GetPixel($sx, $y)
      $sl = [int](0.2126 * $sp.R + 0.7152 * $sp.G + 0.0722 * $sp.B)
      if ($sl -gt $rowMaxLum) { $rowMaxLum = $sl }
    }
    if ($rowMaxLum -lt 200) { $rowMaxLum = 255 }

    for ($x = 0; $x -lt $cropW; $x++) {
      $c = $crop.GetPixel($x, $y)
      $r = [int]$c.R; $g = [int]$c.G; $b = [int]$c.B
      $lum = [int](0.2126 * $r + 0.7152 * $g + 0.0722 * $b)
      $mx = [Math]::Max($r, [Math]::Max($g, $b))
      $mn = [Math]::Min($r, [Math]::Min($g, $b))
      $chroma = $mx - $mn

      $delta = $rowMaxLum - $lum

      if ($chroma -gt $chromaCut -and $delta -lt ($deltaOpaque + 8)) {
        $a = 0
      }
      elseif ($delta -ge $deltaHardInk) {
        $a = 255
      }
      else {
        $a = 0
      }

      if ($a -le 12) { $a = 0 }
      $argb.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, $ink.R, $ink.G, $ink.B))
    }
  }

  $crop.Dispose()

  # 5) Trim to non-transparent pixels (removes any remaining padding/haze edges)
  $alphaMin = 12
  $tMinX = $cropW; $tMinY = $cropH; $tMaxX = -1; $tMaxY = -1
  for ($y = 0; $y -lt $cropH; $y++) {
    for ($x = 0; $x -lt $cropW; $x++) {
      if ($argb.GetPixel($x, $y).A -ge $alphaMin) {
        if ($x -lt $tMinX) { $tMinX = $x }
        if ($y -lt $tMinY) { $tMinY = $y }
        if ($x -gt $tMaxX) { $tMaxX = $x }
        if ($y -gt $tMaxY) { $tMaxY = $y }
      }
    }
  }

  $final = $argb
  if ($tMaxX -ge 0) {
    $trimPad = 8
    $tx0 = [Math]::Max(0, $tMinX - $trimPad)
    $ty0 = [Math]::Max(0, $tMinY - $trimPad)
    $tx1 = [Math]::Min($cropW - 1, $tMaxX + $trimPad)
    $ty1 = [Math]::Min($cropH - 1, $tMaxY + $trimPad)
    $tw = $tx1 - $tx0 + 1
    $th = $ty1 - $ty0 + 1

    $trimmed = New-Object System.Drawing.Bitmap($tw, $th, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $tgfx = [System.Drawing.Graphics]::FromImage($trimmed)
    $tgfx.DrawImage(
      $argb,
      (New-Object System.Drawing.Rectangle(0, 0, $tw, $th)),
      (New-Object System.Drawing.Rectangle($tx0, $ty0, $tw, $th)),
      [System.Drawing.GraphicsUnit]::Pixel
    )
    $tgfx.Dispose()
    $argb.Dispose()
    $final = $trimmed
  }

  if (Test-Path $Output) { Remove-Item $Output -Force }
  $final.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
  $final.Dispose()

  Write-Output "Updated $Output from $Source (band $yStart-$yEnd, crop ${cropW}x${cropH})"
}
finally {
  $bmp.Dispose()
}
