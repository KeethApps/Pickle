import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { colors } from '../src/theme/tokens';
import { Button } from '../src/ui/Button';
import { Input } from '../src/ui/Inputs';
import { Sheet } from '../src/ui/Sheet';
import { Text } from '../src/ui/Text';
import { useStore } from '../src/data/store';

/** Stands in for the system share sheet while developing: paste a link, it lands in the Inbox. */
export default function PasteSheet() {
  const router = useRouter();
  const addLink = useStore((s) => s.addLink);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const res = addLink(url);
    if (res.error) return setError(res.error);
    if (res.duplicate) return router.replace({ pathname: '/share', params: { dup: res.duplicate.id } });
    if (res.item) router.replace({ pathname: '/share', params: { id: res.item.id } });
  };

  return (
    <Sheet title="Paste a link" subtitle="Saves to the Inbox. Sharing from other apps does the same.">
      <Input leftIcon="link" autoFocus value={url} onChangeText={(t) => { setUrl(t); setError(null); }} placeholder="https://" autoCapitalize="none" keyboardType="url" onSubmitEditing={save} />
      {error ? <Text color={colors.dangerText} style={{ marginTop: 10 }}>{error}</Text> : null}
      <Button label="Save to Inbox" onPress={save} disabled={!url.trim()} style={{ marginTop: 16 }} />
    </Sheet>
  );
}
