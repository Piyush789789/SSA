import { LoginScreen } from '@ssa/shared';

export default function Login() {
  return (
    <LoginScreen
      appName="Admin"
      icon="shield-checkmark-outline"
      demo={{ email: 'admin@ssa.edu', password: 'admin123' }}
    />
  );
}
