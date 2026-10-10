import { AppRouter } from '@/routes';
import { AuthProvider } from '@/context/AuthContext';
import { I18nProvider } from '@/i18n/I18nProvider';

export const App = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </I18nProvider>
  );
};

export default App;
