import clsx from 'clsx'

type SkeletonProps = {
  className?: string
}

const Skeleton = ({ className }: SkeletonProps) => (
  <div className={clsx('animate-pulse rounded-xl bg-white/5', className)} aria-hidden="true" />
)

export default Skeleton
