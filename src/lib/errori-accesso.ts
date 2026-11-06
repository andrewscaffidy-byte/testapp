/** Traduce in italiano i messaggi di errore del sistema di accesso. */
export function messaggioErroreAccesso(messaggio: string | undefined | null): string {
  const m = (messaggio ?? "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Email o password non corretti.";
  if (m.includes("email not confirmed"))
    return "Devi prima confermare l'indirizzo email: apri il link che ti abbiamo inviato.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Esiste già un account con questa email. Prova ad accedere.";
  if (
    m.includes("password should be") ||
    m.includes("weak password") ||
    m.includes("password is too")
  )
    return "La password è troppo debole: usa almeno 8 caratteri, meglio se con lettere e numeri.";
  if (m.includes("pwned") || m.includes("leaked") || m.includes("compromised"))
    return "Questa password è comparsa in violazioni di dati note. Scegline un'altra.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes"))
    return "Troppi tentativi in poco tempo. Attendi qualche minuto e riprova.";
  if (m.includes("invalid email") || m.includes("unable to validate email") || m.includes("email address is not allowed") || m.includes("email address") && m.includes("invalid"))
    return "L'indirizzo email non è valido.";
  if (m.includes("same password") || m.includes("different from the old"))
    return "La nuova password deve essere diversa da quella attuale.";
  if (m.includes("network") || m.includes("fetch"))
    return "Connessione assente. Controlla la rete e riprova.";
  return "Si è verificato un errore. Riprova tra poco.";
}
