import Dexie, { Table } from 'dexie';
import { Transaction } from './types';

export type SyncOp = 'add' | 'update' | 'delete';

export interface SyncQueueItem {
  id?: number; // auto-increment primary key
  userId: string;
  txId: string;
  op: SyncOp;
  payload?: any; // full Transaction for 'add', Partial<Transaction> for 'update', unused for 'delete'
  createdAt: number;
  retries: number;
}

// Local cache row = Transaction + ownerId (always set, used as the index for per-user queries)
export type CachedTransaction = Transaction & { ownerId: string };

class BluTrackerDexie extends Dexie {
  transactions!: Table<CachedTransaction, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('blutracker-offline');
    this.version(1).stores({
      // 'id' is the primary key (matches Transaction.id / Supabase row id)
      transactions: 'id, ownerId, date',
      // '++id' = auto-increment primary key, used to preserve insertion order for flushing
      syncQueue: '++id, userId, txId, createdAt',
    });
  }
}

export const dexieDb = new BluTrackerDexie();
