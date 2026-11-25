/// <reference types="vite/client" />
import { KineticAPI } from '../../shared/types'

declare global {
  interface Window {
    kinetic: KineticAPI
  }
}
