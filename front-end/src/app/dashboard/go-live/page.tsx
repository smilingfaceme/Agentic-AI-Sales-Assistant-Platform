import { redirect } from 'next/navigation';

export default function GoLivePageRoute() {
  redirect('/dashboard/go-live/status');
}
