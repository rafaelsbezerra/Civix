interface ConversationAvatarProps {
  initials: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

const avatarSizes = {
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-12 text-sm',
} as const;

export function ConversationAvatar({
  initials,
  color,
  size = 'md',
}: ConversationAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${avatarSizes[size]} ${color}`}
    >
      {initials}
    </span>
  );
}
