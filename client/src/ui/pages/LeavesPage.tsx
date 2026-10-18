import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataPage } from '../RecordPage';
import type { User } from '../types';
import { api } from '../api';
import { Empty, ErrorBox, Loading, PageHead } from '../common';

type ActiveLeave = {
  id: string;
  student: { user: { name: string }; rollNumber: string };
  reason: string;
  fromAt: string;
  toAt: string;
  decidedBy: { name: string } | null;
};

export default function LeavesPage({ user }: { user: User }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const { data: activeLeaves = [], isLoading, isError } = useQuery<ActiveLeave[]>({
    queryKey: ['leaves', 'currently-away'],
    queryFn: () => api.get('/leaves/currently-away').then((response) => response.data),
    enabled: user.role === 'ADMIN' && showCurrent,
  });

  if (user.role !== 'ADMIN') return <DataPage path="/leaves" user={user} />;

  if (showCurrent) {
    return (
      <>
        <PageHead
          eyebrow="RESIDENCE OPERATIONS"
          title="Currently on leave"
          desc="Students with an approved leave that includes the current time."
          action={<button className="secondary" onClick={() => setShowCurrent(false)}>All leave requests</button>}
        />
        {isLoading ? <Loading /> : isError ? <ErrorBox /> : activeLeaves.length === 0 ? (
          <Empty title="No students currently away" text="Approved leave requests active at this time will appear here." />
        ) : (
          <section className="panel table-panel">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Student</th><th>Roll number</th><th>Reason</th><th>From</th><th>Until</th><th>Approved by</th></tr>
                </thead>
                <tbody>
                  {activeLeaves.map((leave) => (
                    <tr key={leave.id}>
                      <td>{leave.student.user.name}</td>
                      <td>{leave.student.rollNumber}</td>
                      <td>{leave.reason}</td>
                      <td>{new Date(leave.fromAt).toLocaleString()}</td>
                      <td>{new Date(leave.toAt).toLocaleString()}</td>
                      <td>{leave.decidedBy?.name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </>
    );
  }

  return (
    <>
      <div className="page-actions">
        <button className="secondary" onClick={() => setShowCurrent(true)}>Currently away now</button>
      </div>
      <DataPage path="/leaves" user={user} />
    </>
  );
}
