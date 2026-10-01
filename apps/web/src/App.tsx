import { LoginScreen } from './screens/LoginScreen';
import { PatientView } from './screens/PatientView';
import { StaffView } from './screens/StaffView';
import { useSession } from './session';
import { Button } from './ui/ui';

export function App() {
  const { session, signOut } = useSession();

  return (
    <div className="wrap">
      <header>
        <div>
          <h1>{session ? session.specialist.name : 'Specialist Waitlist'}</h1>
          {session && <p className="clinic-sub">{session.specialist.clinic}</p>}
        </div>
        {session && (
          <div className="session">
            <span>
              Signed in as {session.user.name} ({session.user.role})
            </span>
            <Button variant="secondary" onClick={signOut}>
              Sign out
            </Button>
          </div>
        )}
      </header>

      {!session && <LoginScreen />}
      {session?.user.role === 'patient' && <PatientView />}
      {session?.user.role === 'staff' && <StaffView />}
    </div>
  );
}
