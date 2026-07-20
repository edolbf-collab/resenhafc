# Publicação no Cloudflare Pages

1. Descompacte o pacote.
2. No Cloudflare, abra **Workers & Pages**.
3. Use **Create application > Pages > Upload assets**.
4. Arraste todo o conteúdo desta pasta, mantendo `index.html` na raiz.
5. Publique.
6. Copie a URL HTTPS criada.
7. No Supabase, inclua essa URL em **Authentication > URL Configuration**.

Para atualizar, faça um novo Direct Upload com a versão completa da pasta. Também é possível conectar um repositório GitHub; como o projeto não requer compilação, deixe o comando de build vazio.
