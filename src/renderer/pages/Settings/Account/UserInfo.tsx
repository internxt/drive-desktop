import Button from '../../../components/Button';

export default function UserInfo({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  function nameToInitials(fullName: string) {
    const namesArray = fullName.trim().split(' ');
    if (namesArray.length === 1) return `${namesArray[0].charAt(0)}`;
    else {
      const first = namesArray[0].charAt(0);
      const second = namesArray[namesArray.length - 1].charAt(0);
      return first + second;
    }
  }

  const initials = nameToInitials(name);

  return (
    <div className="flex items-center">
      <Avatar initials={initials} />
      <div className="ml-4 flex-grow">
        <h1 className="font-semibold text-neutral-700">{name}</h1>
        <p className="text-sm text-m-neutral-100">{email}</p>
      </div>
      <Button onClick={window.electron.logout}>Log out</Button>
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-20 text-xl font-semibold text-blue-80">
      <p>{initials}</p>
    </div>
  );
}
