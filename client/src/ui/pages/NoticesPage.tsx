import { DataPage } from '../RecordPage';
import type { User } from '../types';

export default function NoticesPage({ user }: { user: User }) {
  return <DataPage path="/notices" user={user} />;
}
