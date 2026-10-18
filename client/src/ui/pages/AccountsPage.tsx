import { DataPage } from '../RecordPage';
import type { User } from '../types';

export default function AccountsPage({ user }: { user: User }) {
  return <DataPage path="/accounts" user={user} />;
}
