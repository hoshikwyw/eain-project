# Combines supabase/migrations/*.sql into supabase/ALL_MIGRATIONS.sql for
# pasting into the Supabase SQL editor when the CLI cannot reach the database.
# Usage: powershell -File scripts/combine-migrations.ps1
$root = Split-Path -Parent $PSScriptRoot
$files = Get-ChildItem (Join-Path $root "supabase\migrations\*.sql") | Sort-Object Name
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- Eain: all migrations combined for the Supabase SQL editor.")
[void]$sb.AppendLine("-- Generated $(Get-Date -Format 'yyyy-MM-dd') from supabase/migrations. Run once on an empty project.")
[void]$sb.AppendLine("begin;")
foreach ($f in $files) {
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("-- ===== $($f.Name) =====")
  [void]$sb.AppendLine([System.IO.File]::ReadAllText($f.FullName))
}
[void]$sb.AppendLine("")
[void]$sb.AppendLine("-- ===== record versions so 'supabase db push' later skips these files =====")
[void]$sb.AppendLine("create schema if not exists supabase_migrations;")
[void]$sb.AppendLine("create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);")
foreach ($f in $files) {
  $v = $f.BaseName.Split('_')[0]
  $n = $f.BaseName.Substring($v.Length + 1)
  [void]$sb.AppendLine("insert into supabase_migrations.schema_migrations (version, name) values ('$v', '$n') on conflict do nothing;")
}
[void]$sb.AppendLine("commit;")
$utf8 = New-Object System.Text.UTF8Encoding($false)
$out = Join-Path $root "supabase\ALL_MIGRATIONS.sql"
[System.IO.File]::WriteAllText($out, $sb.ToString(), $utf8)
Write-Output "Wrote $out ($((Get-Content $out | Measure-Object -Line).Lines) lines)"
