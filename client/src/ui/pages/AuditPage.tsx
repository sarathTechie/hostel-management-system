import { DataPage } from '../RecordPage';
import type { User } from '../types';

export default function AuditPage({ user }: { user: User }) {
  return <DataPage path="/audit" user={user} />;
}
