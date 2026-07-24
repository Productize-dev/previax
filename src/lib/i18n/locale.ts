/**
 * Language policy for Previax:
 * - Product chrome (nav, dashboard, buttons, toasts) is ONE locale at a time.
 * - Do not mix languages in the UI.
 * - Conversational AI mirrors the language the user is writing in.
 * - Catalog / structured content follows the active UI locale so listings match chrome.
 */

export type AppLocale = "en" | "es";

/** Active product UI language. Change here when shipping full i18n. */
export const UI_LOCALE: AppLocale = "en";

const SPANISH_SIGNAL =
  /[áéíóúüñ¿¡]|(\b(hola|gracias|por favor|busca|buscar|comunidad|comunidades|casa|casas|hogar|hogares|habitacion(?:es)?|rec[aá]maras?|baño|baños|presupuesto|quiero|necesito|a[ñn]adir|agregar|mostrar|ocultar|ayuda|cómo|como|dónde|donde)\b)/i;

/** Infer the language of a free-text message (search, chat, paste). */
export function detectMessageLocale(text: string): AppLocale {
  const sample = text.trim();
  if (!sample) return UI_LOCALE;
  if (SPANISH_SIGNAL.test(sample)) return "es";
  return "en";
}

export function localeDisplayName(locale: AppLocale): string {
  return locale === "es" ? "Spanish" : "English";
}

/**
 * Instruction for chatty AI replies — match the user's language,
 * never mix languages in a single reply.
 */
export function aiConversationLanguageRule(userText: string): string {
  const locale = detectMessageLocale(userText);
  const name = localeDisplayName(locale);
  return `Reply entirely in ${name}. Do not mix languages in the same reply.`;
}

/**
 * Instruction for structured catalog fields (descriptions, highlights, tags).
 * These must match the product UI locale so the site stays monolingual.
 */
export function aiCatalogLanguageRule(): string {
  const name = localeDisplayName(UI_LOCALE);
  return `Write all user-facing field values in ${name} only (UI locale). Slug-like tags stay lowercase English kebab-case. Do not mix languages.`;
}

/** Search can accept any language; internal semantic query stays English for embeddings. */
export function aiSearchLanguageRule(): string {
  return [
    "Understand buyer queries in any language (especially English and Spanish).",
    "Extract filters accurately regardless of query language.",
    "semanticQuery must be a short English phrase for embedding search.",
    "Do not invent cities that are not in the known cities list.",
  ].join(" ");
}
