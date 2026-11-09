// Configuration publique. Ne jamais ajouter de cle service_role / sb_secret ici.
// Le build remplit configuredOrigin avec KIZUNA_SITE_URL ou l'URL Netlify.
(() => {
  const configuredOrigin = ""; // KIZUNA_NETLIFY_ORIGIN
  const publicSettings = {
  "supabaseUrl": "https://hxbujmdzidtwmalmqrwt.supabase.co",
  "supabaseKey": "sb_publishable_ateJlp_U1eRYN0qYjcsF1g_OF1AZ6y9",
  "discordEnabled": true,
  "serverEconomy": true,
  "v3Economy": false
};
  window.KIZUNA_CONFIG = Object.freeze({
    ...publicSettings,
    siteUrl: configuredOrigin || window.location.origin
  });
})();
