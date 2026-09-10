
// Size map: tailwind w/h classes and border-width for each size variant
const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

// Color map: border-color (faded) + border-top-color (solid) for each color variant
const colorClasses = {
  primary: 'border-primary/20 border-t-primary',
  white: 'border-white/20 border-t-white',
};

export const Spinner = ({ size = 'md', color = 'primary' }) => {
  const sz = sizeClasses[size] ?? sizeClasses.md;
  const cl = colorClasses[color] ?? colorClasses.primary;

  return (
    <div className="flex items-center justify-center">
      <div className={`${sz} ${cl} rounded-full animate-spin`} />
    </div>
  );
};

export const Skeleton = ({ width = '100%', height = '20px', borderRadius = '6px', className = '' }) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
};

export default Spinner;
