import { useMutation, useQuery } from '@tanstack/react-query';
import type { Role, UserSummary } from '@waitlist/shared';
import { useApi } from '../api/ApiContext';
import { describeError } from '../api/client';
import { useSession } from '../session';
import { Alert, Button, Card } from '../ui/ui';

/** Demo sign-in: pick a seeded user. A real identity provider replaces this screen. */
export function LoginScreen() {
  const api = useApi();
  const { signIn } = useSession();

  const users = useQuery({ queryKey: ['demo-users'], queryFn: () => api.demoUsers() });
  const login = useMutation({
    mutationFn: ({ role, id }: { role: Role; id: number }) => api.login(role, id),
    onSuccess: signIn,
  });

  const error = login.error ?? users.error;

  function group(title: string, role: Role, list: UserSummary[]) {
    return (
      <div className="login-group">
        <h3>{title}</h3>
        <div className="login-options">
          {list.map((user) => (
            <Button key={user.id} variant="secondary" disabled={login.isPending} onClick={() => login.mutate({ role, id: user.id })}>
              {user.name}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card title="Sign in">
      <p>Demo sign-in: choose a seeded user. No password is needed.</p>
      {error && <Alert>{describeError(error)}</Alert>}
      {users.data && (
        <>
          {group('Patients', 'patient', users.data.patients)}
          {group('Staff', 'staff', users.data.staff)}
        </>
      )}
    </Card>
  );
}
