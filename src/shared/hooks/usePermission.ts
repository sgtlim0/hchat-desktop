import { useState, useEffect } from 'react'

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported'

export function usePermission(name: PermissionName): {
  state: PermissionState
  isGranted: boolean
  isDenied: boolean
} {
  const [state, setState] = useState<PermissionState>('prompt')

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      setState('unsupported')
      return
    }

    let mounted = true

    navigator.permissions
      .query({ name })
      .then((status) => {
        if (!mounted) return
        setState(status.state as PermissionState)

        const handler = () => {
          if (mounted) setState(status.state as PermissionState)
        }
        status.addEventListener('change', handler)
        return () => status.removeEventListener('change', handler)
      })
      .catch(() => {
        if (mounted) setState('unsupported')
      })

    return () => {
      mounted = false
    }
  }, [name])

  return {
    state,
    isGranted: state === 'granted',
    isDenied: state === 'denied',
  }
}
