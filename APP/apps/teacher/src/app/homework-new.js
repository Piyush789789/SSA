import {
  Button,
  Chips,
  ErrorBox,
  Field,
  Screen,
  SectionTitle,
  api,
  daysFromTodayIso,
  formatDate,
  useAuth,
} from '@ssa/shared';
import { router } from 'expo-router';
import { useState } from 'react';

const DUE_OPTIONS = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'In a week', days: 7 },
];

export default function NewHomework() {
  const { profile } = useAuth();
  const [className, setClassName] = useState(profile?.assignedClasses[0]);
  const [subject, setSubject] = useState(profile?.subjects[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState(daysFromTodayIso(3));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim()) {
      setError(new Error('Give the homework a title.'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api('/homework', {
        method: 'POST',
        body: {
          className,
          subject,
          title: title.trim(),
          description: description.trim() || null,
          instructions: instructions.trim() || null,
          dueDate,
        },
      });
      router.back();
    } catch (e) {
      setError(e);
      setSaving(false);
    }
  }

  return (
    <Screen footer={<Button title="Assign homework" icon="send-outline" onPress={submit} loading={saving} />}>
      <SectionTitle>Class</SectionTitle>
      <Chips options={(profile?.assignedClasses ?? []).map((c) => ({ label: c, value: c }))} value={className} onChange={setClassName} />
      <SectionTitle>Subject</SectionTitle>
      <Chips options={(profile?.subjects ?? []).map((s) => ({ label: s, value: s }))} value={subject} onChange={setSubject} />
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Exercise 4.2, questions 1–10" />
      <Field label="Description" value={description} onChangeText={setDescription} placeholder="What should students do?" multiline />
      <Field label="Instructions (optional)" value={instructions} onChangeText={setInstructions} placeholder="Any extra instructions" />
      <SectionTitle>Due {formatDate(dueDate)}</SectionTitle>
      <Chips
        options={DUE_OPTIONS.map((o) => ({ label: o.label, value: daysFromTodayIso(o.days) }))}
        value={dueDate}
        onChange={setDueDate}
      />
      {error ? <ErrorBox error={error} /> : null}
    </Screen>
  );
}
