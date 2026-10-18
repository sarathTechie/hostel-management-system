import { DataPage } from '../RecordPage';
import type { User } from '../types';

export default function MessPage({ user }: { user: User }) {
  return <DataPage path="/mess" user={user} />;
}
