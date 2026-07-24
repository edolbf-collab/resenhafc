/* Resenha FC Build 118 — carregamento resiliente do cliente Supabase. */
(() => {
  "use strict";

  const SOURCES = [
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
    "https://unpkg.com/@supabase/supabase-js@2"
  ];
  const TIMEOUT_MS = 12000;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (window.supabase?.createClient) return resolve(window.supabase);
      const existing = document.querySelector(`script[data-resenha-cloud-src="${src}"]`);
      if (existing) existing.remove();
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.resenhaCloudSrc = src;
      const timer = setTimeout(() => {
        script.remove();
        reject(new Error("Tempo esgotado ao carregar o cliente de nuvem."));
      }, TIMEOUT_MS);
      script.onload = () => {
        clearTimeout(timer);
        if (window.supabase?.createClient) resolve(window.supabase);
        else reject(new Error("A biblioteca de nuvem foi recebida, mas não foi inicializada."));
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error("Falha ao baixar a biblioteca de nuvem."));
      };
      document.head.appendChild(script);
    });
  }

  async function loadCloudClient() {
    if (window.supabase?.createClient) return window.supabase;
    let lastError = null;
    for (const source of SOURCES) {
      try {
        const client = await loadScript(source);
        window.RESENHA_CLOUD_LOAD_ERROR = null;
        return client;
      } catch (error) {
        lastError = error;
        console.warn("Fonte do cliente Supabase indisponível:", source, error);
      }
    }
    const error = new Error(navigator.onLine === false
      ? "Sem conexão com a internet para carregar o cliente de nuvem."
      : "Não foi possível carregar o cliente de nuvem pelas fontes disponíveis.");
    error.cause = lastError;
    window.RESENHA_CLOUD_LOAD_ERROR = error;
    throw error;
  }

  window.RESENHA_LOAD_CLOUD_CLIENT = loadCloudClient;
  window.RESENHA_CLOUD_READY = loadCloudClient();
  window.addEventListener("online", () => {
    if (!window.supabase?.createClient) {
      window.RESENHA_CLOUD_READY = loadCloudClient();
    }
  });
})();
