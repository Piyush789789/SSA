import { Badge, Button, Card, Empty, Loaded, Screen, api, formatDate, styles, useApi } from '@ssa/shared';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

/** Exams with their results status; admins publish results so students and parents can see them. */
export default function Exams() {
  const state = useApi('/exams');
  const [busy, setBusy] = useState(null);

  function togglePublish(exam) {
    const publish = exam.resultsStatus !== 'Published';
    Alert.alert(
      publish ? 'Publish results' : 'Unpublish results',
      publish
        ? `Students and parents will see the results of "${exam.name}".`
        : `Results of "${exam.name}" will be hidden from students and parents.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: publish ? 'Publish' : 'Unpublish',
          onPress: async () => {
            setBusy(exam.id);
            try {
              await api(`/exams/${exam.id}/${publish ? 'publish' : 'unpublish'}`, { method: 'POST' });
              state.reload();
            } catch (e) {
              Alert.alert('Could not update', e.message);
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      <Loaded state={state}>
        {(exams) =>
          exams.length === 0 ? (
            <Empty text="No exams yet." icon="document-text-outline" />
          ) : (
            exams.map((exam) => (
              <Card key={exam.id} title={exam.name} right={<Badge label={exam.status} />}>
                <Text style={styles.muted}>
                  {exam.type} · {formatDate(exam.startDate)} – {formatDate(exam.endDate)}
                </Text>
                <Text style={[styles.muted, { marginTop: 4 }]}>Classes: {exam.classes.join(', ')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <Badge label={`Results: ${exam.resultsStatus}`} tone={exam.resultsStatus === 'Published' ? 'success' : 'warning'} />
                  <Button
                    title={exam.resultsStatus === 'Published' ? 'Unpublish' : 'Publish results'}
                    variant="secondary"
                    onPress={() => togglePublish(exam)}
                    loading={busy === exam.id}
                    style={{ paddingVertical: 8 }}
                  />
                </View>
              </Card>
            ))
          )
        }
      </Loaded>
    </Screen>
  );
}
