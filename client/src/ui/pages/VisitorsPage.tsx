import { DataPage } from '../RecordPage';
import type { User } from '../types';

export default function VisitorsPage({ user }: { user: User }) {
  return <DataPage path="/visitors" user={user} />;
}
