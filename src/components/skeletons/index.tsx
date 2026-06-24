/**
 * Route-level skeleton fallbacks. Render an instant layout sketch while
 * the lazy route chunk + initial data loads. Replace the generic spinner
 * to eliminate blank screens on first paint.
 */

const shimmer = "bg-[#ececec] md:animate-pulse";

const ShellHeader = () => (
  <>
    <div className="h-7 bg-[#2f2f2f] flex items-center justify-center text-[11px] tracking-[.15em] text-white font-medium">
      BE POSH WITH POSHPLEX
    </div>
    <div className="h-16 border-b flex items-center justify-center font-bold tracking-widest text-lg">
      POSHPLEX
    </div>
  </>
);

export const GenericSkeleton = () => (
  <div className="min-h-screen flex flex-col">
    <ShellHeader />
    <div className="flex-1 p-6 grid gap-3">
      <div className={`${shimmer} h-60 rounded-sm`} />
      <div className={`${shimmer} h-8 w-1/2 rounded-sm`} />
      <div className={`${shimmer} h-8 w-1/3 rounded-sm`} />
    </div>
  </div>
);

export const HomeSkeleton = () => (
  <div className="min-h-screen flex flex-col">
    <ShellHeader />
    <div className="flex-1 grid gap-3 p-3 md:p-6">
      <div className={`${shimmer} h-[240px] md:h-[420px] rounded-sm`} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${shimmer} aspect-square rounded-sm`} />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`${shimmer} aspect-[3/4] rounded-sm`} />
        ))}
      </div>
    </div>
  </div>
);

export const CategorySkeleton = () => (
  <div className="min-h-screen flex flex-col">
    <ShellHeader />
    <div className="flex-1 grid gap-3 p-3 md:p-6">
      <div className={`${shimmer} h-10 w-2/3 rounded-sm`} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`${shimmer} aspect-[3/4] rounded-sm`} />
        ))}
      </div>
    </div>
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="min-h-screen flex flex-col">
    <ShellHeader />
    <div className="flex-1 grid md:grid-cols-2 gap-4 p-3 md:p-8">
      <div className={`${shimmer} aspect-[4/3.5] md:aspect-square rounded-sm`} />
      <div className="grid gap-3 content-start">
        <div className={`${shimmer} h-9 w-3/4 rounded-sm`} />
        <div className={`${shimmer} h-6 w-1/3 rounded-sm`} />
        <div className={`${shimmer} h-10 w-1/2 rounded-sm`} />
        <div className={`${shimmer} h-24 w-full rounded-sm`} />
        <div className={`${shimmer} h-12 w-full rounded-sm`} />
      </div>
    </div>
  </div>
);

export const AccountSkeleton = () => (
  <div className="min-h-screen flex flex-col">
    <ShellHeader />
    <div className="flex-1 p-4 md:p-8 grid gap-3">
      <div className={`${shimmer} h-10 w-1/3 rounded-sm`} />
      <div className="grid md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${shimmer} h-28 rounded-sm`} />
        ))}
      </div>
    </div>
  </div>
);
