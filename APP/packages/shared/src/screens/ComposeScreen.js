import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text } from 'react-native';

import { api } from '../api';
import { useAuth } from '../auth';
import { combine, useApi } from '../useApi';
import { Button, Chips, ErrorBox, Field, Loaded, Screen, SectionTitle, styles } from '../ui';

/**
 * Teachers and admins write to a whole class or privately to one student's family.
 * Students and parents write to a teacher of their (child's) class.
 */
export function ComposeScreen() {
  const { role } = useAuth();
  const staff = role === 'TEACHER' || role === 'ADMIN';
  return staff ? <StaffCompose /> : <FamilyCompose />;
}

function StaffCompose() {
  const classes = useApi('/classes');
  const [recipientType, setRecipientType] = useState('CLASS');
  const [className, setClassName] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const students = useApi(recipientType === 'STUDENT' && className ? `/classes/${className}/students` : null);

  const ready = className && (recipientType === 'CLASS' || studentId);
  const request = recipientType === 'CLASS'
    ? { recipientType, className }
    : { recipientType, recipientId: studentId };

  return (
    <Loaded state={classes}>
      {(classList) => (
        <MessageForm canSend={!!ready} buildRequest={() => request}>
          <SectionTitle>Send to</SectionTitle>
          <Chips
            options={[
              { label: 'Whole class', value: 'CLASS' },
              { label: 'One student’s family', value: 'STUDENT' },
            ]}
            value={recipientType}
            onChange={(value) => {
              setRecipientType(value);
              setStudentId(null);
            }}
          />
          <SectionTitle>Class</SectionTitle>
          <Chips
            options={classList.filter((c) => c.studentCount > 0).map((c) => ({ label: c.id, value: c.id }))}
            value={className}
            onChange={(value) => {
              setClassName(value);
              setStudentId(null);
            }}
          />
          {recipientType === 'STUDENT' && className ? (
            <>
              <SectionTitle>Student</SectionTitle>
              <Loaded state={students}>
                {(list) => (
                  <Chips
                    options={(list ?? []).map((s) => ({ label: `${s.rollNumber}. ${s.name}`, value: s.id }))}
                    value={studentId}
                    onChange={setStudentId}
                  />
                )}
              </Loaded>
            </>
          ) : null}
        </MessageForm>
      )}
    </Loaded>
  );
}

function FamilyCompose() {
  const classes = useApi('/classes');
  const teachers = useApi('/teachers');
  const [teacherId, setTeacherId] = useState(null);

  // Only teachers who teach one of the student's (or children's) classes can be messaged.
  const options = useMemo(() => {
    if (!classes.data || !teachers.data) return [];
    const myClasses = new Set(classes.data.map((c) => c.id));
    return teachers.data
      .filter((t) => t.assignedClasses.some((c) => myClasses.has(c)))
      .map((t) => ({ label: `${t.name} (${t.subjects.join(', ')})`, value: t.id }));
  }, [classes.data, teachers.data]);

  return (
    <Loaded state={combine(classes, teachers)}>
      <MessageForm canSend={!!teacherId} buildRequest={() => ({ recipientType: 'TEACHER', recipientId: teacherId })}>
        <SectionTitle>Teacher</SectionTitle>
        {options.length === 0 ? (
          <Text style={styles.muted}>No teachers found for your class.</Text>
        ) : (
          <Chips options={options} value={teacherId} onChange={setTeacherId} />
        )}
      </MessageForm>
    </Loaded>
  );
}

function MessageForm({ children, canSend, buildRequest }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  async function send() {
    if (!subject.trim() || !body.trim()) {
      setError(new Error('Write a subject and a message.'));
      return;
    }
    setSending(true);
    setError(null);
    try {
      await api('/messages', { method: 'POST', body: { ...buildRequest(), subject: subject.trim(), body: body.trim() } });
      router.back();
    } catch (e) {
      setError(e);
      setSending(false);
    }
  }

  return (
    <Screen footer={<Button title="Send" icon="send-outline" onPress={send} loading={sending} disabled={!canSend} />}>
      {children}
      <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="Subject" />
      <Field label="Message" value={body} onChangeText={setBody} placeholder="Write your message" multiline />
      {error ? <ErrorBox error={error} /> : null}
    </Screen>
  );
}
