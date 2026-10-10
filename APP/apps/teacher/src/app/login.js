import { LoginScreen } from '@ssa/shared';

export default function Login() {
  return (
    <LoginScreen
      appName="Teacher"
      icon="easel-outline"
      demo={{ email: 'teacher@ssa.edu', password: 'teacher123' }}
    />
  );
}
