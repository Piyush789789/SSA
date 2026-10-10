import React from 'react';
import { Images } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Gallery } from '@/components/gallery/Gallery';
import { useI18n } from '@/i18n/translate';

/** /teacher/gallery, /student/gallery, /parent/gallery — event albums; teachers can add albums and photos. */
export const GalleryPage = () => {
  const { role } = useAuth();
  const { t } = useI18n();
  const canEdit = role === 'teacher';
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        icon={Images}
        title={t('gallery.title')}
        description={canEdit ? t('gallery.adminDescription') : t('gallery.description')}
      />
      <Gallery canEdit={canEdit} />
    </div>
  );
};

export default GalleryPage;
