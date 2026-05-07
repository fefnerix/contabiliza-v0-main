#!/bin/bash
# Verifica se os endpoints críticos respondem corretamente

SUPABASE_URL="https://cbkynnvuiuyjmdjtorvc.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNia3lubnZ1aXV5am1kanRvcnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMjE5NzYsImV4cCI6MjA5MzY5Nzk3Nn0.sGnjssT5k08GqEV1QpJo1fo3ad4TergMw_rjp_kPJtM"

echo "=== Smoke Test Backend ==="

echo -n "1. get-public-settings: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SUPABASE_URL/functions/v1/get-public-settings")
[ "$STATUS" = "200" ] && echo "✅ $STATUS" || echo "❌ $STATUS"

echo -n "2. get-admin-settings (deve ser 401): "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/functions/v1/get-admin-settings")
[ "$STATUS" = "401" ] && echo "✅ $STATUS" || echo "❌ $STATUS (esperado 401)"

echo -n "3. REST branding: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/poupeja_settings?category=eq.branding&select=key" -H "apikey: $ANON_KEY")
[ "$STATUS" = "200" ] && echo "✅ $STATUS" || echo "❌ $STATUS"

echo ""
echo "Se todos ✅ -> backend pronto para produção"

