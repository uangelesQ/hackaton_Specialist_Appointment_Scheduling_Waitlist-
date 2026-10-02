import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Alert, Banner, Button, Card, DataTable, MetaRow, Modal, PreferencePill, SlotCard, Stepper, StatusPill } from './ui';

describe('Button', () => {
  it('renders its label, calls onClick, and respects disabled', () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Join waitlist</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        Join waitlist
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Join waitlist' })).toBeDisabled();
  });

  it('can be small, as the staff controls are', () => {
    render(<Button small>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass('btn-small');
  });

  it.each(['primary', 'secondary', 'decline'] as const)('applies the %s style', (variant) => {
    render(<Button variant={variant}>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass(`btn-${variant}`);
  });
});

describe('Card', () => {
  it('shows a title and its content', () => {
    render(
      <Card title="You're on the waitlist">
        <p>We will notify you here.</p>
      </Card>,
    );
    expect(screen.getByRole('heading', { name: "You're on the waitlist" })).toBeInTheDocument();
    expect(screen.getByText('We will notify you here.')).toBeInTheDocument();
  });
});

describe('PreferencePill', () => {
  it.each([
    ['in_app', 'In-app', 'pref-inapp'],
    ['telephone', 'Telephone', 'pref-telephone'],
    [null, 'Not recorded', 'pref-notrecorded'],
  ] as const)('shows %s as "%s"', (preference, label, className) => {
    render(<PreferencePill preference={preference} />);
    expect(screen.getByText(label)).toHaveClass('pref-pill', className);
  });
});

describe('MetaRow', () => {
  it('lists each label with its value', () => {
    render(
      <MetaRow
        items={[
          { label: 'Joined', value: 'Oct 1' },
          { label: 'Notifications', value: 'Check here' },
        ]}
      />,
    );
    expect(screen.getByText('Joined')).toBeInTheDocument();
    expect(screen.getByText('Oct 1')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Check here')).toBeInTheDocument();
  });
});

describe('Stepper', () => {
  it('marks earlier steps done and the current step current', () => {
    render(<Stepper current={2} />);

    expect(screen.getByText('Joined').parentElement).toHaveClass('done');
    expect(screen.getByText('Waiting').parentElement).toHaveClass('done');
    expect(screen.getByText('Notified').parentElement).toHaveClass('current');
    expect(screen.getByText('Booked').parentElement).not.toHaveClass('done');
    expect(screen.getByText('Booked').parentElement).not.toHaveClass('current');
  });
});

describe('Banner', () => {
  it('announces its message', () => {
    render(<Banner>A slot just opened for you</Banner>);
    expect(screen.getByRole('status')).toHaveTextContent('A slot just opened for you');
  });
});

describe('Alert', () => {
  it('announces an error', () => {
    render(<Alert>Something went wrong.</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
  });
});

describe('SlotCard', () => {
  it('shows when, with whom, and its actions', () => {
    render(
      <SlotCard when="Friday, Oct 2 · 10:30 AM" who="With Dr. Elena Ruiz">
        <Button>Accept</Button>
      </SlotCard>,
    );
    expect(screen.getByText('Friday, Oct 2 · 10:30 AM')).toBeInTheDocument();
    expect(screen.getByText('With Dr. Elena Ruiz')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('shows its title, body and actions as a dialog', () => {
    render(
      <Modal title="Book this appointment?" actions={<Button>Confirm</Button>}>
        Friday, Oct 2 · 10:30 AM with Dr. Elena Ruiz.
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Book this appointment?' });
    expect(dialog).toHaveTextContent('Friday, Oct 2 · 10:30 AM with Dr. Elena Ruiz.');
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });
});

describe('DataTable and StatusPill', () => {
  it('renders headers and rows', () => {
    render(
      <DataTable headers={['#', 'Patient', 'Status']}>
        <tr>
          <td>1</td>
          <td>Ana Torres</td>
          <td>
            <StatusPill status="waiting" />
          </td>
        </tr>
      </DataTable>,
    );
    expect(screen.getByRole('columnheader', { name: 'Patient' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Ana Torres' })).toBeInTheDocument();
  });

  it.each([
    ['waiting', 'Waiting'],
    ['notified', 'Notified'],
    ['booked', 'Booked'],
  ] as const)('labels the %s status', (status, label) => {
    render(<StatusPill status={status} />);
    expect(screen.getByText(label)).toHaveClass(`status-${status}`);
  });
});
