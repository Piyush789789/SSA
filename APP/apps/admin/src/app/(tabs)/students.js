import { Chips, Empty, Field, ListItem, Loaded, Screen, useApi } from '@ssa/shared';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';

export default function Students() {
  const [query, setQuery] = useState('');
  const [className, setClassName] = useState('ALL');
  const classes = useApi('/classes');
  const students = useApi(className === 'ALL' ? '/students' : `/students?className=${className}`);

  const classOptions = useMemo(
    () => [
      { label: 'All', value: 'ALL' },
      ...(classes.data ?? []).filter((c) => c.studentCount > 0).map((c) => ({ label: c.id, value: c.id })),
    ],
    [classes.data],
  );

  const q = query.trim().toLowerCase();
  return (
    <Screen refreshing={students.refreshing} onRefresh={students.reload}>
      <Field value={query} onChangeText={setQuery} placeholder="Search by name or student ID" autoCapitalize="none" />
      <Chips options={classOptions} value={className} onChange={setClassName} />
      <Loaded state={students}>
        {(list) => {
          const shown = q ? list.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)) : list;
          return shown.length === 0 ? (
            <Empty text="No students found." icon="search-outline" />
          ) : (
            shown.map((s) => (
              <ListItem
                key={s.id}
                icon="person-outline"
                title={s.name}
                subtitle={`Class ${s.className} · Roll ${s.rollNumber} · ${s.id}`}
                onPress={() => router.push(`/student/${s.id}`)}
              />
            ))
          );
        }}
      </Loaded>
    </Screen>
  );
}
