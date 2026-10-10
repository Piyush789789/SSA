import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '../api';
import { FileThumb, uploadFile } from '../files';
import { formatDate, formatDateTime } from '../format';
import { colors } from '../theme';
import { combine, useApi } from '../useApi';
import { Badge, Button, Card, ErrorBox, Field, Loaded, Screen, SectionTitle, styles } from '../ui';
import { submissionLabel } from './StudentScreens';

const MAX_FILES = 10;
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * A student (or parent, for a child) hands in homework: an answer and/or photos from the camera or
 * gallery. Opened with ?homeworkId=&studentId=. Photos are uploaded one by one to POST /files, then
 * the submission is saved with their ids. Re-submitting replaces it until the teacher checks it.
 */
export function HomeworkSubmitScreen() {
  const { homeworkId, studentId } = useLocalSearchParams();
  const homework = useApi('/homework');
  const submissions = useApi(studentId ? `/homework-submissions?studentId=${studentId}` : null);
  const state = combine(homework, submissions);

  const hw = homework.data?.find((h) => h.id === homeworkId);
  const existing = submissions.data?.find((s) => s.homeworkId === homeworkId) ?? null;

  const [text, setText] = useState('');
  // Each photo: { key, fileId } (already uploaded) or { key, uri, name, type, size } (picked, not yet uploaded).
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  // Start from the saved submission once it has loaded.
  const initialised = useRef(false);
  useEffect(() => {
    if (!initialised.current && submissions.data) {
      initialised.current = true;
      if (existing) {
        setText(existing.text ?? '');
        setPhotos((existing.fileIds ?? []).map((id) => ({ key: id, fileId: id })));
      }
    }
  }, [submissions.data, existing]);

  async function pick(fromCamera) {
    setError(null);
    const room = MAX_FILES - photos.length;
    if (room <= 0) {
      setError(new Error(`You can attach at most ${MAX_FILES} photos.`));
      return;
    }
    try {
      // Required here, not at the top: expo-image-picker's native module may be missing from an app, and every
      // app loads this package.
      const ImagePicker = require('expo-image-picker');
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', fromCamera ? 'Allow camera access to photograph your homework.' : 'Allow photo access to attach pictures.');
        return;
      }
      const options = { mediaTypes: ['images'], quality: 0.6 };
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync({ ...options, allowsMultipleSelection: true, selectionLimit: room });
      if (result.canceled) return;
      const picked = result.assets.slice(0, room).map((asset, i) => {
        const type = asset.mimeType ?? 'image/jpeg';
        const extension = type.split('/')[1] === 'jpeg' ? 'jpg' : type.split('/')[1] ?? 'jpg';
        return {
          key: `${asset.uri}-${Date.now()}-${i}`,
          uri: asset.uri,
          name: asset.fileName ?? `homework-${Date.now()}-${i}.${extension}`,
          type,
          size: asset.fileSize,
        };
      });
      const tooBig = picked.filter((p) => p.size && p.size > MAX_BYTES);
      if (tooBig.length) {
        setError(new Error('Some photos are larger than 5 MB and were left out.'));
      }
      setPhotos((current) => [...current, ...picked.filter((p) => !(p.size && p.size > MAX_BYTES))]);
    } catch (e) {
      setError(new Error(e?.message ?? 'Could not open the camera or gallery.'));
    }
  }

  async function submit() {
    if (!text.trim() && photos.length === 0) {
      setError(new Error('Write an answer or attach a photo.'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fileIds = [];
      const uploaded = [];
      const toUpload = photos.filter((p) => !p.fileId).length;
      let done = 0;
      for (const photo of photos) {
        if (photo.fileId) {
          fileIds.push(photo.fileId);
          uploaded.push(photo);
          continue;
        }
        setProgress(`Uploading photo ${done + 1} of ${toUpload}…`);
        const file = await uploadFile(photo);
        done += 1;
        fileIds.push(file.id);
        uploaded.push({ key: file.id, fileId: file.id, uri: photo.uri });
      }
      // Keep uploaded ids, so a failed save does not upload the same photos again.
      setPhotos(uploaded);
      setProgress('Saving…');
      const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
      await api(`/homework/${homeworkId}/submission${query}`, {
        method: 'PUT',
        body: { text: text.trim() || null, fileIds },
      });
      Alert.alert('Homework submitted', 'Your teacher will check it.');
      router.back();
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
      setProgress(null);
    }
  }

  const locked = existing?.status === 'REVIEWED';
  const status = submissionLabel(existing);

  return (
    <Screen
      footer={
        locked ? null : (
          <Button
            title={progress ?? (existing ? 'Submit again' : 'Submit homework')}
            icon="cloud-upload-outline"
            onPress={submit}
            loading={saving && !progress}
            disabled={saving || !hw}
          />
        )
      }
    >
      <Loaded state={state}>
        {() =>
          !hw ? (
            <Text style={styles.muted}>This homework could not be found.</Text>
          ) : (
            <>
              <Card title={hw.title} right={<Badge label={`Due ${formatDate(hw.dueDate)}`} tone="info" />}>
                <Text style={styles.muted}>
                  {hw.subject} · {hw.className} · {hw.teacherName}
                </Text>
                {hw.description ? <Text style={[styles.body, { marginTop: 6 }]}>{hw.description}</Text> : null}
              </Card>

              {existing ? (
                <Card title="Your submission" right={<Badge label={status.label} tone={status.tone} />}>
                  <Text style={styles.muted}>Submitted {formatDateTime(existing.submittedAt)}</Text>
                  {existing.feedback ? <Text style={[styles.body, { marginTop: 6 }]}>Teacher: “{existing.feedback}”</Text> : null}
                  {locked ? (
                    <Text style={[styles.muted, { marginTop: 6 }]}>Your teacher has checked this homework; it can no longer be changed.</Text>
                  ) : existing.status === 'REDO' ? (
                    <Text style={[styles.muted, { marginTop: 6, color: colors.danger }]}>Your teacher asked you to redo it. Submit again below.</Text>
                  ) : (
                    <Text style={[styles.muted, { marginTop: 6 }]}>Submitting again replaces it until your teacher checks it.</Text>
                  )}
                </Card>
              ) : null}

              {locked ? (
                <View style={local.photos}>
                  {photos.map((p) => (
                    <FileThumb key={p.key} fileId={p.fileId} size={96} />
                  ))}
                </View>
              ) : (
                <>
                  <Field label="Answer (optional)" value={text} onChangeText={setText} multiline maxLength={4000} placeholder="Type your answer, or attach photos of your work" />
                  <SectionTitle>Photos ({photos.length}/{MAX_FILES})</SectionTitle>
                  <View style={local.photos}>
                    {photos.map((p) => (
                      <View key={p.key}>
                        <FileThumb fileId={p.fileId} uri={p.fileId ? undefined : p.uri} size={96} />
                        <Pressable
                          onPress={() => setPhotos((current) => current.filter((x) => x.key !== p.key))}
                          accessibilityRole="button"
                          accessibilityLabel="Remove photo"
                          style={local.remove}
                          disabled={saving}
                        >
                          <Ionicons name="close" size={14} color="#fff" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <Button title="Camera" icon="camera-outline" variant="secondary" onPress={() => pick(true)} disabled={saving} style={{ flex: 1 }} />
                    <Button title="Gallery" icon="images-outline" variant="secondary" onPress={() => pick(false)} disabled={saving} style={{ flex: 1 }} />
                  </View>
                  {error ? <ErrorBox error={error} /> : null}
                </>
              )}
            </>
          )
        }
      </Loaded>
    </Screen>
  );
}

const local = StyleSheet.create({
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
