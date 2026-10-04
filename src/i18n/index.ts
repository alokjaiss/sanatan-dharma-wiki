import { en, type MessageKey } from './en';

const messages = { en } as const;

export type Locale = keyof typeof messages;
export type { MessageKey };

export const defaultLocale: Locale = 'en';

/** True when a message exists, for keys built at runtime (enum labels). */
export function hasMessage(key: string, locale: Locale = defaultLocale): key is MessageKey {
  return key in messages[locale];
}

/**
 * Look up a UI string. `{name}` placeholders are replaced from `vars`.
 * Every user-facing string in components goes through here so a Hindi edition (Phase 6)
 * only needs a new message file.
 */
export function t(
  key: MessageKey,
  vars?: Record<string, string | number>,
  locale: Locale = defaultLocale,
): string {
  let message: string = messages[locale][key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      message = message.replaceAll(`{${name}}`, String(value));
    }
  }
  return message;
}
