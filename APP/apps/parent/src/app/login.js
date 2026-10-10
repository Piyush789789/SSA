import { LoginScreen } from '@ssa/shared';

export default function Login() {
  return (
    <LoginScreen
      appName="Parent"
      icon="people-outline"
      demo={{ email: 'parent@ssa.edu', password: 'parent123' }}
    />
  );
}
