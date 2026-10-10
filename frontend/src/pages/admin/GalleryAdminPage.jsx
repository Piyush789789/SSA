import React from 'react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { Gallery } from '@/components/gallery/Gallery';
import { useI18n } from '@/i18n/translate';

/** /admin/gallery — create event albums and manage their photos. */
export const GalleryAdminPage = () => {
  const { t } = useI18n();
  return (
    <AdminPageShell activeItemId="gallery" title={t('gallery.title')} description={t('gallery.adminDescription')}>
      <Gallery canEdit />
    </AdminPageShell>
  );
};

export default GalleryAdminPage;
