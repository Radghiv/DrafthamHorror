import { useEffect } from 'react'

// While a sheet is open the page behind it must not scroll with it
function useScrollLock(active) {
    useEffect(() => {
        if (!active) return undefined

        const previous = document.body.style.overflow

        document.body.style.overflow = 'hidden'

        return () => {
            document.body.style.overflow = previous
        }
    }, [active])
}

export default useScrollLock
