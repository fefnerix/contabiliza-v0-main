# Setup Hotmart — Contabiliza

## Pré-requisitos
- Conta Hotmart em https://app.hotmart.com
- Produto criado com pelo menos 2 ofertas (mensal e anual)

## Passo 1: Criar aplicação no Hotmart

Acessar: https://developers.hotmart.com -> Meus Apps -> Criar App

Copiar:
- Client ID
- Client Secret

## Passo 2: Pegar IDs do produto e ofertas

Acessar: https://app.hotmart.com/products
- Product ID: número na URL do produto
- Offer Code mensal: na página de ofertas -> código da oferta
- Offer Code anual: idem

## Passo 3: Configurar webhook (HOT Notification)

Acessar: https://app.hotmart.com/tools -> HOT Notification -> Configurar

URL: https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/hotmart-webhook  
Copiar o hottok gerado.

Eventos necessários:
- PURCHASE_APPROVED
- PURCHASE_COMPLETE
- PURCHASE_CANCELED
- PURCHASE_REFUNDED
- SUBSCRIPTION_CANCELLATION

## Passo 4: Inserir no admin do app

Acessar: [URL do app]/login -> admin@contabiliza.com  
Ir em: Admin -> Configurações -> Hotmart

Preencher:
- hotmart_client_id
- hotmart_client_secret
- hotmart_webhook_secret (hottok)
- hotmart_product_id
- hotmart_offer_code_monthly
- hotmart_offer_code_annual

## Verificação

```bash
curl -X POST "https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/hotmart-webhook?hottok=SEU_HOTTOK" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PURCHASE_APPROVED",
    "id": "test-001",
    "data": {
      "buyer": { "email": "teste@teste.com" },
      "purchase": { "transaction": "HP-TEST-001" },
      "offer": { "code": "SEU_OFFER_CODE_MENSAL" }
    }
  }'
```

Esperado: `{"message":"ok"}` ou similar sem erro 401/500.

