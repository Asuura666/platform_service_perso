import { motion } from 'framer-motion'
import Skeleton from './Skeleton'

const placeholders = Array.from({ length: 6 })

const WebtoonGridSkeleton = () => (
  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
    {placeholders.map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        className="rounded-3xl border border-muted/40 bg-panel/60 p-4"
      >
        <Skeleton className="mb-4 h-40 w-full rounded-2xl" />
        <Skeleton className="mb-2 h-4 w-5/6" />
        <Skeleton className="mb-3 h-3 w-2/3" />
        <Skeleton className="mb-3 h-3 w-1/2" />
        <div className="mt-6 flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-24 rounded-2xl" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-2xl" />
            <Skeleton className="h-9 w-9 rounded-2xl" />
          </div>
        </div>
      </motion.div>
    ))}
  </div>
)

export default WebtoonGridSkeleton
