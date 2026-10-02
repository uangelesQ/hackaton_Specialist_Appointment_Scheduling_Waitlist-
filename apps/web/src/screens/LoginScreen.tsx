import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ContactPreference, Role, UserSummary } from '@waitlist/shared';
import { useApi } from '../api/ApiContext';
import { describeError } from '../api/client';
import { useSession } from '../session';
import { Alert, Button, Card, PreferenceChoice } from '../ui/ui';

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
      <DemoRegistration />
    </Card>
  );
}

/**
 * DEMO ONLY (PS-001 v2.5 Appendix A). Stands in for hospital registration: a name and a contact preference
 * create a patient and sign them in. It lives on the demo sign-in screen, so it exists only where that does.
 */
function DemoRegistration() {
  const api = useApi();
  const { signIn } = useSession();
  const [name, setName] = useState('');
  const [preference, setPreference] = useState<ContactPreference | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const register = useMutation({
    mutationFn: ({ name: n, preference: p }: { name: string; preference: ContactPreference }) => api.register(n, p),
    onSuccess: signIn,
    onError: (err) => setProblem(describeError(err)),
  });

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return setProblem('Enter a name to register.');
    if (!preference) return setProblem('Choose in-app or telephone as the contact preference.');
    setProblem(null);
    register.mutate({ name: trimmed, preference });
  }

  return (
    <div className="login-group">
      <h3>Register (demo)</h3>
      <p>A new patient registers with a name and how they want to be contacted, and is signed in.</p>
      {problem && <Alert>{problem}</Alert>}
      <label className="add-label" htmlFor="register-name">
        Name
      </label>{' '}
      <input id="register-name" className="field" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
      <PreferenceChoice name="register-preference" value={preference} onChange={setPreference} disabled={register.isPending} />
      <Button disabled={register.isPending} onClick={submit}>
        Register
      </Button>
    </div>
  );
}
