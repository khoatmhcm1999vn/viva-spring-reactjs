# Kiem tra cac file .drawio: XML hop le, tham chieu id, va chong lan hinh hoc.
# Chay:  pwsh -File "BA Document/docs/diagrams/_validate.ps1"

$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = Get-ChildItem -Path $dir -Filter *.drawio | Sort-Object Name
$totalProblems = 0

function Get-AbsGeometry {
    param($cellsById, $id)
    $x = 0.0; $y = 0.0
    $cur = $cellsById[$id]
    $self = $cur
    $guard = 0
    while ($cur -ne $null -and $guard -lt 50) {
        $guard++
        $g = $cur.SelectSingleNode('mxGeometry')
        if ($g -ne $null) {
            if ($cur.id -eq $id) {
                $x += [double]($g.GetAttribute('x') -as [double])
                $y += [double]($g.GetAttribute('y') -as [double])
            } else {
                $x += [double]($g.GetAttribute('x') -as [double])
                $y += [double]($g.GetAttribute('y') -as [double])
            }
        }
        $p = $cur.GetAttribute('parent')
        if ([string]::IsNullOrEmpty($p) -or $p -eq '0' -or $p -eq '1') { break }
        if (-not $cellsById.ContainsKey($p)) { break }
        $cur = $cellsById[$p]
    }
    $g0 = $self.SelectSingleNode('mxGeometry')
    $w = [double]($g0.GetAttribute('width') -as [double])
    $h = [double]($g0.GetAttribute('height') -as [double])
    return @{ x = $x; y = $y; w = $w; h = $h }
}

foreach ($f in $files) {
    Write-Host ""
    Write-Host ("=" * 78)
    Write-Host ("FILE: " + $f.Name)
    Write-Host ("=" * 78)

    # 1) XML hop le
    try {
        $doc = New-Object System.Xml.XmlDocument
        $doc.Load($f.FullName)
        Write-Host "  [OK]  XML hop le, parse duoc bang System.Xml"
    } catch {
        Write-Host ("  [LOI] XML KHONG hop le: " + $_.Exception.Message) -ForegroundColor Red
        $totalProblems++
        continue
    }

    $diagrams = $doc.SelectNodes('//diagram')
    Write-Host ("  [OK]  So trang (diagram): " + $diagrams.Count)

    foreach ($d in $diagrams) {
        $name = $d.GetAttribute('name')
        $cells = $d.SelectNodes('.//mxCell')
        $vertices = @()
        $edges = @()
        $cellsById = @{}
        foreach ($c in $cells) {
            $cid = $c.GetAttribute('id')
            if ($cid) { $cellsById[$cid] = $c }
            if ($c.GetAttribute('vertex') -eq '1') { $vertices += $c }
            if ($c.GetAttribute('edge') -eq '1') { $edges += $c }
        }
        Write-Host ""
        Write-Host ("  --- TRANG: " + $name)
        Write-Host ("      hinh: " + $vertices.Count + "   duong noi: " + $edges.Count)

        # 2) Tham chieu source/target phai ton tai
        $badRef = 0
        foreach ($e in $edges) {
            foreach ($attr in @('source','target','parent')) {
                $v = $e.GetAttribute($attr)
                if ($v -and $v -ne '0' -and $v -ne '1' -and -not $cellsById.ContainsKey($v)) {
                    Write-Host ("      [LOI] duong noi '" + $e.GetAttribute('id') + "' tro toi id khong ton tai: " + $attr + "=" + $v) -ForegroundColor Red
                    $badRef++
                }
            }
        }
        foreach ($v in $vertices) {
            $p = $v.GetAttribute('parent')
            if ($p -and $p -ne '0' -and $p -ne '1' -and -not $cellsById.ContainsKey($p)) {
                Write-Host ("      [LOI] hinh '" + $v.GetAttribute('id') + "' co parent khong ton tai: " + $p) -ForegroundColor Red
                $badRef++
            }
        }
        if ($badRef -eq 0) { Write-Host "      [OK]  moi tham chieu id deu hop le" }
        $totalProblems += $badRef

        # 3) Nhan tren duong noi
        $labelled = 0
        foreach ($e in $edges) { if ($e.GetAttribute('value')) { $labelled++ } }
        Write-Host ("      [--]  duong noi co nhan: " + $labelled + "/" + $edges.Count)

        # 4) Chong lan hinh hoc (bo qua quan he cha-con)
        $boxes = @()
        foreach ($v in $vertices) {
            $g = Get-AbsGeometry -cellsById $cellsById -id $v.GetAttribute('id')
            if ($g.w -le 0 -or $g.h -le 0) { continue }
            $boxes += [pscustomobject]@{
                id = $v.GetAttribute('id')
                parent = $v.GetAttribute('parent')
                x = $g.x; y = $g.y; w = $g.w; h = $g.h
                isContainer = ($v.GetAttribute('style') -match 'swimlane|container=1') -or
                              ($v.GetAttribute('style') -match 'dashed=1;verticalAlign=top')
            }
        }
        $overlaps = 0
        for ($i = 0; $i -lt $boxes.Count; $i++) {
            for ($j = $i + 1; $j -lt $boxes.Count; $j++) {
                $a = $boxes[$i]; $b = $boxes[$j]
                if ($a.parent -eq $b.id -or $b.parent -eq $a.id) { continue }
                if ($a.isContainer -or $b.isContainer) { continue }
                $ox = [Math]::Min($a.x + $a.w, $b.x + $b.w) - [Math]::Max($a.x, $b.x)
                $oy = [Math]::Min($a.y + $a.h, $b.y + $b.h) - [Math]::Max($a.y, $b.y)
                if ($ox -gt 1 -and $oy -gt 1) {
                    Write-Host ("      [LOI] CHONG LAN: '" + $a.id + "' va '" + $b.id +
                                "'  (giao nhau " + [int]$ox + " x " + [int]$oy + " px)") -ForegroundColor Red
                    $overlaps++
                }
            }
        }
        if ($overlaps -eq 0) { Write-Host "      [OK]  khong co hinh nao chong lan" }
        $totalProblems += $overlaps

        # 5) Hinh con phai nam trong bien cua hinh cha
        $outOfParent = 0
        foreach ($v in $vertices) {
            $p = $v.GetAttribute('parent')
            if (-not $p -or $p -eq '0' -or $p -eq '1' -or -not $cellsById.ContainsKey($p)) { continue }
            $pg = $cellsById[$p].SelectSingleNode('mxGeometry')
            if ($pg -eq $null) { continue }
            $pw = [double]($pg.GetAttribute('width') -as [double])
            $ph = [double]($pg.GetAttribute('height') -as [double])
            $cg = $v.SelectSingleNode('mxGeometry')
            $cx = [double]($cg.GetAttribute('x') -as [double])
            $cy = [double]($cg.GetAttribute('y') -as [double])
            $cw = [double]($cg.GetAttribute('width') -as [double])
            $ch = [double]($cg.GetAttribute('height') -as [double])
            if ($pw -le 0 -or $ph -le 0 -or $cw -le 0) { continue }
            if (($cx + $cw) -gt ($pw + 1) -or ($cy + $ch) -gt ($ph + 1) -or $cx -lt -1 -or $cy -lt -1) {
                Write-Host ("      [LOI] TRAN KHOI CHA: '" + $v.GetAttribute('id') + "' vuot ra ngoai '" + $p +
                            "'  (con " + [int]($cx+$cw) + "x" + [int]($cy+$ch) + " / cha " + [int]$pw + "x" + [int]$ph + ")") -ForegroundColor Red
                $outOfParent++
            }
        }
        if ($outOfParent -eq 0) { Write-Host "      [OK]  moi hinh con nam gon trong hinh cha" }
        $totalProblems += $outOfParent

        # 6) Uoc luong chieu cao chu so voi chieu cao hop (phat hien chu bi tran/che)
        $overflow = 0
        foreach ($v in $vertices) {
            $style = $v.GetAttribute('style')
            if ($style -match 'umlLifeline|swimlane|cylinder|ellipse|rhombus') { continue }
            if ($style -match 'dashed=1;verticalAlign=top') { continue }
            $raw = $v.GetAttribute('value')
            if (-not $raw) { continue }
            $g = $v.SelectSingleNode('mxGeometry')
            $w = [double]($g.GetAttribute('width') -as [double])
            $h = [double]($g.GetAttribute('height') -as [double])
            if ($w -le 0 -or $h -le 0) { continue }
            $fs = 12.0
            if ($style -match 'fontSize=(\d+)') { $fs = [double]$Matches[1] }
            # tach theo dau ngat dong roi bo the HTML
            $segments = [regex]::Split($raw, '(?i)<br\s*/?>|&#10;')
            $lines = 0
            $cpl = [Math]::Max(8.0, ($w - 16.0) / ($fs * 0.52))
            foreach ($s in $segments) {
                $t = [regex]::Replace($s, '<[^>]+>', '')
                $t = $t -replace '&[a-zA-Z]+;', 'x' -replace '&#\d+;', 'x'
                if ($t.Trim().Length -eq 0) { $lines += 1; continue }
                $lines += [Math]::Ceiling($t.Trim().Length / $cpl)
            }
            $needed = $lines * $fs * 1.3 + 12
            if ($needed -gt ($h * 1.35)) {
                Write-Host ("      [CANH BAO] co the TRAN CHU: '" + $v.GetAttribute('id') + "' can ~" +
                            [int]$needed + "px nhung hop cao " + [int]$h + "px") -ForegroundColor Yellow
                $overflow++
            }
        }
        if ($overflow -eq 0) { Write-Host "      [OK]  moi hop du cao cho noi dung chu (uoc luong)" }
    }
}

Write-Host ""
Write-Host ("=" * 78)
if ($totalProblems -eq 0) {
    Write-Host "KET QUA: FAIL=0 - moi file hop le, khong co chong lan, khong co tham chieu hong." -ForegroundColor Green
} else {
    Write-Host ("KET QUA: FAIL=" + $totalProblems) -ForegroundColor Red
}
Write-Host ("=" * 78)
