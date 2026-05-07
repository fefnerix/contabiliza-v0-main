#!/bin/bash
SUPABASE_URL="https://cbkynnvuiuyjmdjtorvc.supabase.co"

echo "=== Verificação Stripe ==="

echo -n "1. get-plan-config retorna price IDs: "
RESULT=$(curl -s "$SUPABASE_URL/functions/v1/get-plan-config")
echo "$RESULT" | grep -q "priceId" && echo "✅ OK" || echo "❌ Price IDs não configurados"

echo -n "2. Stripe secret configurado: "
RESULT=$(curl -s "$SUPABASE_URL/functions/v1/get-plan-config")
echo "$RESULT" | grep -q '"success":true' && echo "✅ OK" || echo "❌ Erro na config"

echo ""
echo "Se ❌ -> acessar /admin e configurar as keys do Stripe"

