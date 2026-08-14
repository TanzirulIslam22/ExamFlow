export default function Avatar({ name = '', color = '#1A56DB', src = '', size = 32, className = '' }) {
  const init = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  if (src) {
    return (
      <img src={src} alt={name} style={{ width: size, height: size }}
        className={`rounded-full object-cover shrink-0 ${className}`} />
    );
  }

  return (
    <div style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
      className={`rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${className}`}>
      {init}
    </div>
  );
}
