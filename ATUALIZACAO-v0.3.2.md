# Atualização Resenha FC v0.3.2

Esta versão implementa a segunda etapa planejada: exclusão permanente de grupos e peladas semanais recorrentes.

## 1. Backup recomendado

Antes da migração, gere um backup pelo painel do Supabase ou confirme que o projeto possui restauração disponível. A nova função de exclusão de grupo é intencionalmente irreversível.

## 2. Atualizar o Supabase primeiro

No Supabase, abra **SQL Editor**, crie uma consulta e cole todo o conteúdo de:

```text
backend/migration-v0.3.2.sql
```

Execute com o papel `postgres`. O resultado esperado é `Success. No rows returned`.

Depois execute:

```text
backend/backend-healthcheck.sql
```

A verificação deve listar as três colunas de recorrência e as RPCs:

- `create_match_schedule`;
- `delete_scheduled_match_series`;
- `delete_group_permanently`.

## 3. Publicar o frontend

Substitua na raiz do repositório:

```text
app.js
styles.css
index.html
service-worker.js
README.md
CHANGELOG.md
VALIDACAO.md
```

Não substitua o arquivo `supabase-config.js` que já contém suas credenciais públicas.

## 4. Regras implementadas

### Exclusão de grupo

- somente o proprietário visualiza e executa a exclusão;
- fica em **Mais > Personalizar grupo**;
- exige digitar `EXCLUIR`;
- apaga definitivamente jogos, histórico, membros, caixa, avisos, avaliações e demais dados relacionados;
- perfis pessoais e contas Google permanecem no Supabase.

### Pelada semanal

- marque **Repetir esta pelada toda semana** ao agendar;
- escolha entre 2 e 52 ocorrências;
- todas as datas são criadas na mesma transação;
- cada ocorrência possui presença, churrasco e times independentes;
- antes do horário, é possível excluir somente uma data ou a data selecionada e todas as próximas;
- peladas realizadas permanecem no histórico.

## 5. Cache da PWA

O cache passa a se chamar `resenha-fc-v0.3.2`. Após o deploy, feche completamente a PWA ou o Safari e abra novamente.
