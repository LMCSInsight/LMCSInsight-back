/* eslint-disable no-var */

import type { IMemoryDb } from 'pg-mem'
import type { Client } from 'pg'

declare global {
  var __PGMEM_DB__: IMemoryDb | undefined
  var __PG_CLIENT__: Client | undefined
}

export {}
