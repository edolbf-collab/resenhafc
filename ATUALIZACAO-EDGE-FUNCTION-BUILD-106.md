# Edge Function — Build 106

## Função alterada

`publish-announcement`

## Nova ação

`attendance-reminder`

A ação permite que administrador e organizador enviem um lembrete push individual para um membro que ainda não respondeu a um evento ativo.

## Validações no servidor

- remetente precisa ser administrador ou organizador do grupo;
- evento precisa pertencer ao grupo e ainda estar ativo;
- destinatário precisa continuar sendo membro do grupo;
- jogador precisa possuir usuário ativo vinculado;
- envio é recusado quando já existe status `confirmed`, `waitlist` ou `out`;
- o push é enviado apenas às assinaturas ativas do destinatário.

## Publicação

Substitua o código da Edge Function existente `publish-announcement` por esta versão. Não substitua nem remova a função separada `delete-beta-user`.
