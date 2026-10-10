import { AppRouter } from '@/routes';
import { AuthProvider } from '@/context/AuthContext';

export const App = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;
