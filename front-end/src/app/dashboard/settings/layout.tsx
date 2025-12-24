import SettingsPage from '@/components/Dashboard/Settings/SettingsPage';

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SettingsPage>{children}</SettingsPage>
    );
}