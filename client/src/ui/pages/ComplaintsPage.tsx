import { DataPage } from '../RecordPage';
import type { User } from '../types';

export default function ComplaintsPage({ user }: { user: User }) {
  return <DataPage path="/complaints" user={user} />;
}
