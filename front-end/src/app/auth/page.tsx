import { redirect } from 'next/navigation';

export default function AuthPageRoute() {
  redirect('/auth/login');
}
