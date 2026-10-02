import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom does not implement scrolling; screens reset scroll on change.
window.scrollTo = () => {}

afterEach(() => {
  cleanup()
})
