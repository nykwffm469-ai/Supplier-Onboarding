import { ProfileForm } from "@/components/portal/profile-form";

export default function ProfilePage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Company Profile</h1>
        <p className="text-sm text-muted-foreground">Manage diversity flags, workforce data, and company identifiers.</p>
      </div>
      <ProfileForm />
    </div>
  );
}
