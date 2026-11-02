/* Connexion à la base Supabase du salon.
   La clé ci-dessous est une clé PUBLIQUE (publishable) : elle peut être visible.
   Les données sont protégées côté base : les tables ne sont pas accessibles
   directement, seules les fonctions salon_* le sont, et celles de l'espace
   coiffeur exigent un jeton de session obtenu avec le mot de passe. */
window.SalonAPI = (() => {
  const URL = "https://erycxlrmptzwamyvajbv.supabase.co";
  const KEY = "sb_publishable_l-AhRJB-q8bOvca_T0D8qA_URDBOLVM";
  async function rpc(fn, args = {}) {
    const res = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: KEY },
      body: JSON.stringify(args),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error((data && data.message) || "erreur_reseau");
    return data;
  }
  return { rpc };
})();
