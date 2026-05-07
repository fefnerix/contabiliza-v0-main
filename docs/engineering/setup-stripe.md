# Setup Stripe — Contabiliza

## Pré-requisitos
- Conta Stripe em https://dashboard.stripe.com
- Projeto Supabase ativo: cbkynnvuiuyjmdjtorvc

## Passo 1: Pegar credenciais no Stripe

Acessar: https://dashboard.stripe.com/apikeys

| Credencial | Onde fica | Começa com |
|-----------|-----------|------------|
| Secret key | API keys -> Secret key | sk_live_ ou sk_test_ |
| Publishable key | API keys -> Publishable key | pk_live_ ou pk_test_ |

## Passo 2: Criar produtos e preços no Stripe

Acessar: https://dashboard.stripe.com/products -> Add product

Criar 2 preços:
- "Contabiliza Mensal" -> R$ 49,90/mês -> recorrente -> copiar Price ID (price_xxx)
- "Contabiliza Anual" -> R$ 39,90/mês x 12 = R$ 478,80/ano -> recorrente -> copiar Price ID

## Passo 3: Configurar Webhook no Stripe

Acessar: https://dashboard.stripe.com/webhooks -> Add endpoint

URL: https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/stripe-webhook
Eventos: checkout.session.completed, customer.subscription.updated,
         customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed

Copiar o Signing secret (whsec_xxx)

## Passo 4: Inserir no admin do app

Acessar: [URL do seu app]/login -> admin@contabiliza.com / Admin@123!
Ir em: Admin -> Configurações -> Stripe

Preencher:
- stripe_secret_key: sk_live_xxx
- stripe_publishable_key: pk_live_xxx
- stripe_webhook_secret: whsec_xxx
- stripe_price_id_monthly: price_xxx
- stripe_price_id_annual: price_xxx

## Verificação pós-configuração

Executar:

```bash
curl -s -X GET https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/get-plan-config
# Esperado: { success: true, prices: { monthly: { priceId: "price_xxx" }, annual: { priceId: "price_xxx" } } }
```

