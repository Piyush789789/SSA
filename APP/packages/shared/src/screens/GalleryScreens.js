import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { api } from '../api';
import { fileSource, pickPhotos, uploadFile } from '../files';
import { formatDate, todayIso } from '../format';
import { useT } from '../i18n';
import { colors } from '../theme';
import { useApi } from '../useApi';
import { Button, Card, DateStepper, Empty, ErrorBox, Field, Loaded, Screen, styles } from '../ui';

const MAX_PICK = 20;

/** Album grid (newest first, as the server sends them). Teachers and admins can create an album. */
export function GalleryScreen({ canManage = false }) {
  const state = useApi('/events/albums');
  const { width } = useWindowDimensions();
  const tile = (width - 16 * 2 - 12) / 2;
  const [creating, setCreating] = useState(false);

  return (
    <Screen
      refreshing={state.refreshing}
      onRefresh={state.reload}
      footer={canManage && !creating ? <Button title="New album" icon="add-circle-outline" onPress={() => setCreating(true)} /> : null}
    >
      {creating ? <NewAlbumForm onClose={() => setCreating(false)} /> : null}
      <Loaded state={state}>
        {(albums) =>
          albums.length === 0 ? (
            <Empty text="No photo albums yet." icon="images-outline" />
          ) : (
            <View style={local.grid}>
              {albums.map((album) => (
                <Pressable
                  key={album.id}
                  onPress={() => router.push({ pathname: '/album', params: { albumId: album.id } })}
                  accessibilityRole="button"
                  style={({ pressed }) => [local.albumTile, { width: tile }, pressed && styles.pressed]}
                >
                  {album.photoIds?.length ? (
                    <Image source={fileSource(album.photoIds[0])} style={[local.cover, { height: tile * 0.75 }]} resizeMode="cover" />
                  ) : (
                    <View style={[local.cover, local.noCover, { height: tile * 0.75 }]}>
                      <Ionicons name="images-outline" size={32} color={colors.muted} />
                    </View>
                  )}
                  <View style={{ padding: 10 }}>
                    <Text style={[styles.body, { fontWeight: '700' }]} numberOfLines={2}>
                      {album.title}
                    </Text>
                    <Text style={styles.muted}>
                      {formatDate(album.eventDate)} · {album.photoIds?.length ?? 0} photos
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )
        }
      </Loaded>
    </Screen>
  );
}

function NewAlbumForm({ onClose }) {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(todayIso());
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function create() {
    if (!title.trim()) {
      setError(new Error('Give the album a title.'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const album = await api('/events/albums', {
        method: 'POST',
        body: { title: title.trim(), eventDate, description: description.trim() || null, photoIds: [] },
      });
      onClose();
      if (album?.id) router.push({ pathname: '/album', params: { albumId: album.id } });
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="New album">
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Annual Sports Day" maxLength={200} />
      <DateStepper label="Event date" value={eventDate} onChange={setEventDate} />
      <Field label="Description (optional)" value={description} onChangeText={setDescription} multiline maxLength={2000} />
      {error ? <ErrorBox error={error} /> : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Cancel" variant="secondary" onPress={onClose} disabled={saving} style={{ flex: 1 }} />
        <Button title="Create album" icon="checkmark" onPress={create} loading={saving} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

/** One album's photo grid with a full-screen swipeable viewer. Opened with ?albumId=. */
export function AlbumScreen({ canManage = false }) {
  const { albumId } = useLocalSearchParams();
  const state = useApi('/events/albums');
  const { width } = useWindowDimensions();
  const t = useT();
  const size = (width - 16 * 2 - 8 * 2) / 3;
  const [viewing, setViewing] = useState(null); // index in photoIds
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const album = state.data?.find((a) => String(a.id) === String(albumId));

  async function addPhotos(fromCamera) {
    setError(null);
    let picked;
    try {
      picked = await pickPhotos({
        fromCamera,
        limit: MAX_PICK,
        prefix: 'event',
        onSkipped: (n) => setError(new Error(`${n} photo(s) larger than 5 MB were left out.`)),
      });
    } catch (e) {
      setError(new Error(e?.message ?? 'Could not open the camera or gallery.'));
      return;
    }
    if (!picked.length) return;
    const ids = [];
    try {
      for (let i = 0; i < picked.length; i += 1) {
        setProgress(`Uploading ${i + 1} of ${picked.length}…`);
        const file = await uploadFile(picked[i]);
        ids.push(file.id);
      }
    } catch (e) {
      setError(e);
    }
    try {
      if (ids.length) {
        setProgress('Saving…');
        await api(`/events/albums/${album.id}/photos`, { method: 'POST', body: { photoIds: ids } });
        state.reload();
      }
    } catch (e) {
      setError(e);
    } finally {
      setProgress(null);
    }
  }

  function deletePhoto(photoId) {
    Alert.alert(t('Delete'), 'Remove this photo from the album?', [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/events/albums/${album.id}/photos/${photoId}`, { method: 'DELETE' });
            setViewing(null);
            state.reload();
          } catch (e) {
            Alert.alert('Could not delete', e.message);
          }
        },
      },
    ]);
  }

  function deleteAlbum() {
    Alert.alert(t('Delete album'), `Delete "${album.title}" and all its photos?`, [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/events/albums/${album.id}`, { method: 'DELETE' });
            router.back();
          } catch (e) {
            Alert.alert('Could not delete', e.message);
          }
        },
      },
    ]);
  }

  const photos = album?.photoIds ?? [];

  return (
    <Screen
      refreshing={state.refreshing}
      onRefresh={state.reload}
      footer={
        canManage && album ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title={progress ?? 'Add photos'} icon="images-outline" onPress={() => addPhotos(false)} loading={!!progress && progress === 'Saving…'} disabled={!!progress} style={{ flex: 2 }} />
            <Button title="Camera" icon="camera-outline" variant="secondary" onPress={() => addPhotos(true)} disabled={!!progress} style={{ flex: 1 }} />
          </View>
        ) : null
      }
    >
      {album ? <Stack.Screen options={{ title: album.title }} /> : null}
      <Loaded state={state}>
        {() =>
          !album ? (
            <Empty text="This album could not be found." icon="images-outline" />
          ) : (
            <>
              <Card title={album.title}>
                <Text style={styles.muted}>
                  {formatDate(album.eventDate)} · {photos.length} photos{album.createdBy ? ` · by ${album.createdBy}` : ''}
                </Text>
                {album.description ? <Text style={[styles.body, { marginTop: 6 }]}>{album.description}</Text> : null}
              </Card>
              {error ? <ErrorBox error={error} /> : null}
              {photos.length === 0 ? (
                <Empty text="No photos in this album yet." icon="image-outline" />
              ) : (
                <View style={[local.grid, { gap: 8 }]}>
                  {photos.map((id, index) => (
                    <Pressable key={id} onPress={() => setViewing(index)} accessibilityRole="imagebutton" accessibilityLabel={`Photo ${index + 1}`}>
                      <Image source={fileSource(id)} style={{ width: size, height: size, borderRadius: 8, backgroundColor: colors.border }} resizeMode="cover" />
                    </Pressable>
                  ))}
                </View>
              )}
              {canManage ? (
                <Button title="Delete album" variant="danger" icon="trash-outline" onPress={deleteAlbum} style={{ marginTop: 20 }} />
              ) : null}
            </>
          )
        }
      </Loaded>

      <PhotoViewer
        key={viewing ?? 'closed'}
        photoIds={photos}
        index={viewing}
        onClose={() => setViewing(null)}
        onDelete={canManage ? deletePhoto : null}
      />
    </Screen>
  );
}

/** Full-screen black viewer; swipe left/right between photos. */
export function PhotoViewer({ photoIds, index, onClose, onDelete }) {
  const { width, height } = useWindowDimensions();
  const [current, setCurrent] = useState(index ?? 0);
  const t = useT();
  const visible = index != null && photoIds.length > 0;
  const shown = Math.min(current, photoIds.length - 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={local.viewer}>
        {visible ? (
          <FlatList
            data={photoIds}
            keyExtractor={(id) => String(id)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={Math.min(index, photoIds.length - 1)}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={fileSource(item)} style={{ width, height: height * 0.8 }} resizeMode="contain" />
              </View>
            )}
          />
        ) : null}
        <View style={local.viewerBar}>
          <Text style={local.viewerText}>
            {shown + 1} / {photoIds.length}
          </Text>
          <View style={{ flexDirection: 'row', gap: 18 }}>
            {onDelete ? (
              <Pressable onPress={() => onDelete(photoIds[shown])} accessibilityRole="button" accessibilityLabel="Delete photo" hitSlop={10}>
                <Ionicons name="trash-outline" size={24} color="#fff" />
              </Pressable>
            ) : null}
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('Close')} hitSlop={10}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const local = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  albumTile: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cover: { width: '100%', backgroundColor: colors.border },
  noCover: { alignItems: 'center', justifyContent: 'center' },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  viewerBar: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewerText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
