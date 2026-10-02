import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { ContactPreference, EntryStatus } from '@waitlist/shared';

type Variant = 'primary' | 'secondary' | 'decline';

export function Button({
  variant = 'primary',
  small = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean }) {
  return <button type="button" {...props} className={`btn btn-${variant}${small ? ' btn-small' : ''}`} />;
}

export function Card({ title, children, tone }: { title?: string; children: ReactNode; tone?: 'confirm' | 'empty' }) {
  return (
    <section className={`card${tone === 'confirm' ? ' confirm' : ''}${tone === 'empty' ? ' empty-state' : ''}`}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

export function MetaRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="meta-row">
      {items.map((item) => (
        <div className="meta-item" key={item.label}>
          <div className="k">{item.label}</div>
          <div className="v">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

const STEPS = ['Joined', 'Waiting', 'Notified', 'Booked'];

/** `current` is the index of the active step: 1 waiting, 2 notified, 3 booked. */
export function Stepper({ current }: { current: number }) {
  return (
    <div className="stepper">
      {STEPS.map((label, index) => (
        <div key={label} className={`step${index < current ? ' done' : index === current ? ' current' : ''}`}>
          <div className="dot" />
          <div className="label">{label}</div>
        </div>
      ))}
    </div>
  );
}

function BellIcon() {
  return (
    <svg className="bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function Banner({ children }: { children: ReactNode }) {
  return (
    <div className="banner" role="status">
      <BellIcon />
      <span>{children}</span>
    </div>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div className="alert" role="alert">
      {children}
    </div>
  );
}

export function SlotCard({ when, who, children }: { when: string; who: string; children?: ReactNode }) {
  return (
    <div className="slot-card">
      <div>
        <div className="when">{when}</div>
        <div className="sub">{who}</div>
      </div>
      {children && <div className="slot-actions">{children}</div>}
    </div>
  );
}

export function Modal({ title, children, actions }: { title: string; children: ReactNode; actions: ReactNode }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        <p>{children}</p>
        <div className="modal-actions">{actions}</div>
      </div>
    </div>
  );
}

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="card table-card">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const STATUS_LABELS: Partial<Record<EntryStatus, string>> = {
  waiting: 'Waiting',
  notified: 'Notified',
  booked: 'Booked',
};

export function StatusPill({ status }: { status: EntryStatus }) {
  return <span className={`status-pill status-${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}

const PREFERENCE_PILLS = {
  in_app: { label: 'In-app', className: 'pref-inapp' },
  telephone: { label: 'Telephone', className: 'pref-telephone' },
  notRecorded: { label: 'Not recorded', className: 'pref-notrecorded' },
} as const;

/** How a patient asked to be reached. `null` is shown as "Not recorded", never as telephone. */
export function PreferencePill({ preference }: { preference: ContactPreference | null }) {
  const { label, className } = PREFERENCE_PILLS[preference ?? 'notRecorded'];
  return <span className={`pref-pill ${className}`}>{label}</span>;
}
