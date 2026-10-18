import { DataPage } from '../RecordPage';
import type { User } from '../types';

export default function StudentsPage({ user }: { user: User }) {
  return <DataPage path="/students" user={user} />;
}
