#!/bin/bash
SUPABASE_URL="https://cbkynnvuiuyjmdjtorvc.supabase.co"
HOTTOK=${1:-"insira_seu_hottok_aqui"}

echo "=== Verificação Hotmart ==="

echo -n "1. Webhook endpoint acessível: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$SUPABASE_URL/functions/v1/hotmart-webhook?hottok=INVALIDO" \
  -H "Content-Type: application/json" \
  -d '{"event":"test"}')
[ "$STATUS" = "401" ] && echo "✅ Endpoint ativo (401 esperado para token inválido)" || echo "⚠️ Status: $STATUS"

echo ""
echo "Uso: ./verify-hotmart.sh SEU_HOTTOK"

