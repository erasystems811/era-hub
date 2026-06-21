import { ReactNode, HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  sm?: boolean
  hover?: boolean
}

export function Glass({ children, sm, hover, className, ...rest }: Props) {
  return (
    <div
      className={cn(
        sm ? 'glass-sm' : 'glass',
        'p-5',
        hover && 'transition-all duration-200 hover:shadow-glass-lg hover:-translate-y-0.5 cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
