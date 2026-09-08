#!/usr/bin/env bash
# =============================================================================
# Roda as migrations reais + a matriz de segurança num Postgres local limpo.
#
#   ./supabase/tests/run-local.sh
#
# Variáveis: PGHOST (default /tmp), PGPORT (default 5433), PGUSER (default postgres)
# =============================================================================
set -euo pipefail

PGHOST="${PGHOST:-/tmp}"
PGPORT="${PGPORT:-5433}"
PGUSER="${PGUSER:-postgres}"
DB="${DB:-dz_rls_test}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

psql_() { psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -v ON_ERROR_STOP=1 "$@"; }

echo "→ recriando banco de teste '$DB'"
psql_ -d postgres -qc "drop database if exists $DB;" >/dev/null
psql_ -d postgres -qc "create database $DB;" >/dev/null

echo "→ stub local da plataforma Supabase (auth, storage, roles)"
psql_ -d "$DB" -q -f "$ROOT/supabase/tests/00_local_supabase_stub.sql"

echo "→ aplicando migrations de produção, em ordem"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "   · $(basename "$f")"
  psql_ -d "$DB" -q -f "$f"
done

echo "→ executando a matriz de segurança"
psql_ -d "$DB" -f "$ROOT/supabase/tests/01_rls_matrix.sql"

echo ""
echo "✓ TODAS AS VERIFICAÇÕES DE RLS, GRANTS E CONSTRAINTS PASSARAM"
