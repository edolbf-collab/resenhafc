# Resenha FC — Beta 1.0 Build 104

## Implementações

### Gestão de presenças

Administrador e organizador agora podem abrir **Gerenciar presenças** nos detalhes de uma pelada futura e registrar, para qualquer membro ativo:

- confirmado;
- talvez;
- ausente;
- sem resposta.

As alterações ficam registradas no banco com autor, data e origem. O próprio membro continua podendo atualizar sua resposta posteriormente.

### Sorteio da espera inicial

Quando a quantidade de pessoas que pretendem jogar ultrapassa o limite da pelada, aparece o botão **Sortear espera inicial**.

O sorteio:

- considera todos os confirmados;
- escolhe aleatoriamente apenas a quantidade excedente;
- grava o resultado e a posição de cada pessoa na espera;
- permite refazer o sorteio mediante confirmação;
- invalida uma separação de times anterior;
- coloca novas confirmações, após o sorteio e com o limite preenchido, no fim da espera;
- promove automaticamente a primeira pessoa da espera quando alguém que começaria jogando desiste.

A opção manual **Espera** foi retirada da resposta individual. A espera passa a ser consequência do limite e do sorteio.

## Ordem obrigatória de publicação

1. No SQL Editor do Supabase, execute:

   `backend/backend-migration-beta-1.0-build-104.sql`

2. Confira o resultado com:

   `backend/backend-healthcheck-beta-1.0-build-104.sql`

3. Publique os arquivos do frontend ou substitua o conteúdo pelo pacote completo.

4. Preserve o arquivo `supabase-config.js` atualmente configurado no repositório.

Não há alteração na Edge Function de notificações nem nas chaves VAPID.

## Validação recomendada

1. Crie ou utilize uma pelada futura com limite baixo, por exemplo 4 pessoas.
2. Como administrador ou organizador, confirme 5 ou mais membros em **Gerenciar presenças**.
3. Confirme que aparece o aviso de excedentes.
4. Execute **Sortear espera inicial**.
5. Verifique a lista **Começam jogando** e a ordem da **Espera inicial**.
6. Marque um confirmado como ausente e confirme a promoção automática da posição 1.
7. Confirme a presença de outro membro depois do sorteio e verifique a entrada no fim da espera.
8. Refaça o sorteio e confirme que o resultado anterior é substituído.
