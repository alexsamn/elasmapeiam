/**
 * Nome e textos do app num lugar só. O nome ainda não foi decidido:
 * para trocar, mude APP_NAME (e APP_SHORT_NAME) aqui. O título das páginas,
 * o cabeçalho e o manifest do PWA (/manifest.webmanifest) leem estas constantes.
 */
export const APP_NAME = "ElasMapeiam";
/** Nome curto para a tela inicial do celular (até 12 caracteres). */
export const APP_SHORT_NAME = "ElasMapeiam";
export const APP_DESCRIPTION = "Saiba se o bicicletário ainda vale antes de sair de casa. Mapa colaborativo para ciclistas de São Paulo.";
export const APP_THEME_COLOR = "#111111";
export const APP_BACKGROUND_COLOR = "#F5F5F3";

/** Título de página no formato "Seção · Nome do app". */
export function pageTitle(section?: string) {
  return section ? `${section} · ${APP_NAME}` : APP_NAME;
}
