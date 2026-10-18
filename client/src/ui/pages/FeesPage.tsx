import { DataPage } from '../RecordPage';
import type { User } from '../types';

export default function FeesPage({ user }: { user: User }) {
  return <DataPage path="/fees" user={user} />;
}
