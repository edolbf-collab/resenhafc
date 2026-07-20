/*
 * Resenha FC — configuração pública do Supabase.
 *
 * 1. Crie o projeto no Supabase.
 * 2. Execute backend/supabase-schema.sql no SQL Editor.
 * 3. Copie a Project URL e a Publishable key em Settings > API Keys.
 *
 * A Publishable key é própria para aplicações web e móveis. Nunca coloque uma
 * Secret key ou a antiga service_role key neste arquivo.
 */
window.RESENHA_CONFIG = {
  supabaseUrl: "",
  supabasePublishableKey: "",
  authRedirectUrl: window.location.origin,
  appName: "Resenha FC"
};
