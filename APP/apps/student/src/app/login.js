import { LoginScreen } from '@ssa/shared';

export default function Login() {
  return (
    <LoginScreen
      appName="Student"
      icon="school-outline"
      demo={{ email: 'student@ssa.edu', password: 'student123' }}
    />
  );
}
