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
      <div className="flex-grow ml-4">
        <h1 className="font-semibold text-neutral-700">{name}</h1>
        <p className="text-sm text-m-neutral-100">{email}</p>
      </div>
      <Button onClick={window.electron.logout}>Log out</Button>
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="h-14 w-14 flex text-xl justify-center items-center rounded-full text-blue-80 bg-blue-20 font-semibold">
      <p>{initials}</p>
    </div>
  );
}
