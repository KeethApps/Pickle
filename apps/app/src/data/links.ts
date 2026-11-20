import { Linking, Platform } from 'react-native';

/** Opens a link in the browser or maps app. Returns false when it could not be opened. */
export async function openUrl(url: string | null | undefined): Promise<boolean> {
  if (!url) return false;
  try {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Opens several links at once (laptop "Open N links"). Browsers may block all but the first tab. */
export function openMany(urls: string[]): number {
  let opened = 0;
  for (const url of urls) {
    if (Platform.OS === 'web') {
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      if (w) opened += 1;
    }
  }
  return opened;
}
