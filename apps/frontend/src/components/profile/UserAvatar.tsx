type UserAvatarProps = {
  src?: string | null;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
};

export function UserAvatar({ src, firstName, lastName, size = "md", className = "" }: UserAvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`rounded-full bg-slate-200 object-cover ${sizeClass[size]} ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 font-semibold text-white ${sizeClass[size]} ${className}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}
