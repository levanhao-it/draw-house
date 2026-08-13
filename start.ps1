param(
    [string]$Root = $PSScriptRoot
)

if (-not $Root) {
    $Root = Get-Location
}

function New-ScaffoldFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $fullPath = Join-Path $Root $Path
    $directory = Split-Path $fullPath -Parent

    if (-not (Test-Path $directory)) {
        New-Item -ItemType Directory -Force -Path $directory | Out-Null
    }

    if (Test-Path $fullPath) {
        Write-Host "  = $Path" -ForegroundColor Yellow
        return
    }

    New-Item -ItemType File -Path $fullPath | Out-Null
    Write-Host "  + $Path" -ForegroundColor DarkGray
}

$files = @(
    "eslint.config.js",
    "index.html",
    "package.json",
    "postcss.config.js",
    "README.md",
    "tailwind.config.js",
    "tsconfig.json",
    "tsconfig.node.json",
    "vite.config.ts",
    "docs/00-PRD.md",
    "docs/01-SPEC-FUNCTIONAL.md",
    "docs/02-DATA-MODEL.md",
    "docs/03-DESIGN-SYSTEM.md",
    "docs/04-AUTO-LAYOUT.md",
    "docs/05-TECH-ARCHITECTURE.md",
    "docs/06-TASKS.md",
    "docs/07-TEST-PLAN.md",
    "docs/08-PROMPT-LIBRARY.md",
    "public/fonts/README.md",
    "src/App.test.tsx",
    "src/App.tsx",
    "src/index.css",
    "src/main.tsx",
    "src/test-setup.ts",
    "src/auto-layout/imageStats.ts",
    "src/auto-layout/index.ts",
    "src/auto-layout/relaxation.ts",
    "src/auto-layout/scoring.ts",
    "src/design/contrast.test.ts",
    "src/design/contrast.ts",
    "src/design/icons.ts",
    "src/design/presets.ts",
    "src/design/tokens.ts",
    "src/features/brand/BrandKitModal.tsx",
    "src/features/export/ExportPanel.tsx",
    "src/features/export/exportWorker.ts",
    "src/features/export/useExport.ts",
    "src/features/forms/PoiForm.tsx",
    "src/features/forms/RouteForm.tsx",
    "src/features/forms/UnitForm.tsx",
    "src/features/forms/ZoneForm.tsx",
    "src/features/markers/MarkerList.tsx",
    "src/features/markers/MarkerToolbar.tsx",
    "src/features/markers/QuickInputPopover.tsx",
    "src/features/markers/StageCanvas.tsx",
    "src/features/persistence/imageRepo.ts",
    "src/features/persistence/projectRepo.ts",
    "src/features/persistence/useAutosave.ts",
    "src/features/presets/PresetPicker.tsx",
    "src/features/presets/RatioPicker.tsx",
    "src/features/upload/classifyImage.ts",
    "src/features/upload/ImageDropzone.tsx",
    "src/features/upload/useImageLoader.ts",
    "src/hooks/useScene.ts",
    "src/i18n/vi.ts",
    "src/lib/download.ts",
    "src/lib/fonts.ts",
    "src/lib/id.ts",
    "src/lib/storage.ts",
    "src/render-core/geom.test.ts",
    "src/render-core/geom.ts",
    "src/render-core/index.ts",
    "src/render-core/place.ts",
    "src/render-core/layers/backgroundLayer.ts",
    "src/render-core/layers/brandLayer.ts",
    "src/render-core/layers/effectLayer.ts",
    "src/render-core/layers/legendLayer.ts",
    "src/render-core/layers/markerLayer.ts",
    "src/render-core/shapes/curvedArrow.ts",
    "src/render-core/shapes/numberBadge.ts",
    "src/render-core/shapes/poiPill.ts",
    "src/render-core/shapes/routeLine.ts",
    "src/render-core/shapes/unitCard.ts",
    "src/render-core/shapes/zonePolygon.ts",
    "src/render-core/text/truncate.ts",
    "src/render-core/text/wrap.ts",
    "src/store/brandStore.ts",
    "src/store/historyStore.ts",
    "src/store/projectStore.ts",
    "src/store/uiStore.ts",
    "src/types/index.ts",
    "src/types/invariants.test.ts",
    "src/types/invariants.ts"
)

foreach ($file in $files) {
    New-ScaffoldFile -Path $file
}

Write-Host "Done! $($files.Count) files checked." -ForegroundColor Green
Write-Host "Legend: '+' created, '=' already existed." -ForegroundColor Cyan
