import { router } from 'expo-router';
import { useState } from 'react';

import { api } from '../api';
import { Button, Chips, ErrorBox, Field, Screen, SectionTitle } from '../ui';

const PRIORITIES = [
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const AUDIENCES = [
  { label: 'Everyone', value: 'ALL' },
  { label: 'Students', value: 'STUDENTS' },
  { label: 'Parents', value: 'PARENTS' },
  { label: 'Staff', value: 'STAFF' },
];

/** Publishes a notice (teachers and admins). */
export function NoticeFormScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [audience, setAudience] = useState('ALL');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function publish() {
    if (!title.trim() || !description.trim()) {
      setError(new Error('Enter a title and the notice text.'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api('/notices', {
        method: 'POST',
        body: { title: title.trim(), description: description.trim(), priority, audience },
      });
      router.back();
    } catch (e) {
      setError(e);
      setSaving(false);
    }
  }

  return (
    <Screen footer={<Button title="Publish notice" icon="megaphone-outline" onPress={publish} loading={saving} />}>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Parent–Teacher Meeting" />
      <Field label="Notice" value={description} onChangeText={setDescription} placeholder="Write the notice" multiline />
      <SectionTitle>Priority</SectionTitle>
      <Chips options={PRIORITIES} value={priority} onChange={setPriority} />
      <SectionTitle>Who can see it</SectionTitle>
      <Chips options={AUDIENCES} value={audience} onChange={setAudience} />
      {error ? <ErrorBox error={error} /> : null}
    </Screen>
  );
}
