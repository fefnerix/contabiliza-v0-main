# Setup n8n — Contabiliza

## Pré-requisitos
- Servidor com Docker instalado
- Domínio com HTTPS para o n8n (obrigatório para webhooks)
- Evolution API instalada e conectada ao WhatsApp

## Subir infraestrutura

```bash
cd infra/n8n
cp .env.example .env
# Editar .env com suas senhas
docker compose up -d
```

## Verificar

```bash
docker compose ps
# Todos devem estar "healthy"
```

## Acessar n8n

http://seu-servidor:5678  
Criar conta admin na primeira vez.

## Importar flows (ordem obrigatória)
1. Importar `Executor.json`
2. Importar `Consulta_Cadastro.json`
3. Importar `Receptor.json`

## Configurar credenciais no n8n

Settings -> Credentials -> Add:
- OpenAI API Key
- Supabase: URL = https://cbkynnvuiuyjmdjtorvc.supabase.co, Service Role Key = [sua key]
- Redis: host, porta, senha
- RabbitMQ: host, porta, usuário, senha

## Ativar flows (ordem obrigatória)
1. Ativar Executor
2. Ativar Consulta_Cadastro
3. Ativar Receptor

## Configurar Evolution API webhook

No painel da Evolution API:
- Webhook URL: https://n8n.seudominio.com/webhook/poupeja-dev-rcpto
- Eventos: `MESSAGES_UPSERT`, `CONNECTION_UPDATE`

## Teste

Enviar "Olá" pelo WhatsApp para o número do bot.  
Esperado: bot responde com apresentação.

