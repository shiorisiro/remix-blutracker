import { getSupabase, isSupabaseConfigured, localDb } from './lib/supabase';

export const collection = (db: any, path: string) => ({ path });
export const doc = (db: any, path?: string, id?: string) => {
  if (typeof db === 'object' && db.path && !path) {
    return { path: db.path + '/' + (id || crypto.randomUUID()) };
  }
  return { path: path + (id ? '/' + id : '') };
};
export const serverTimestamp = () => new Date().toISOString();

// Helper to parse path parts and identify appropriate tables
function parsePath(path: string) {
  const parts = path.split('/');
  // Expected formats:
  // 1. "users/:uid" -> parts.length = 2, parts[0] = "users"
  // 2. "users/:uid/transactions/:txId" -> parts.length = 4, parts[0] = "users", parts[2] = "transactions"
  
  if (parts.length === 2 && parts[0] === 'users') {
    return {
      type: 'user',
      table: 'users',
      uid: parts[1],
      id: parts[1],
    };
  } else if (parts.length === 4 && parts[0] === 'users' && parts[2] === 'transactions') {
    return {
      type: 'transaction',
      table: 'transactions',
      uid: parts[1],
      id: parts[3],
    };
  } else {
    // Fallback/unknown
    return {
      type: parts[2] || parts[0],
      table: parts[2] || parts[0],
      uid: parts[1],
      id: parts[3] || parts[1],
    };
  }
}

// Helper to sanitize payload for standard Relational / Supabase structures
// Maps field names to both camelCase and snake_case to support database designs automatically
function toSupabasePayload(data: any, userId: string) {
  const isDebtVal = data.isDebt !== undefined ? data.isDebt : (data.is_debt || false);
  const debtTypeVal = data.debtType !== undefined ? data.debtType : (data.debt_type || null);
  const isSettledVal = data.isSettled !== undefined ? data.isSettled : (data.is_settled || false);

  return {
    id: data.id,
    title: data.title || '',
    amount: Number(data.amount) || 0,
    type: data.type || 'expense',
    category: data.category || 'General',
    classification: data.classification || 'personal',
    date: data.date || new Date().toISOString().split('T')[0],
    time: data.time || '00:00',
    // Camel case support
    isDebt: isDebtVal,
    debtType: debtTypeVal,
    isSettled: isSettledVal,
    userId: userId,
    ownerId: userId,
    // Snake case mappings for common database designs
    is_debt: isDebtVal,
    debt_type: debtTypeVal,
    is_settled: isSettledVal,
    user_id: userId,
    owner_id: userId
  };
}

// Converts a database record into the format required by the UI
function fromSupabasePayload(row: any) {
  return {
    id: row.id,
    title: row.title || '',
    amount: Number(row.amount) || 0,
    type: row.type || 'expense',
    category: row.category || 'General',
    classification: row.classification || 'personal',
    date: row.date,
    time: row.time || '00:00',
    isDebt: row.is_debt !== undefined ? row.is_debt : (row.isDebt || false),
    debtType: row.debt_type !== undefined ? row.debt_type : (row.debtType || null),
    isSettled: row.is_settled !== undefined ? row.is_settled : (row.isSettled || false),
    userId: row.user_id || row.userId || '',
  };
}

export const getDoc = async (docRef: any) => {
  const parsed = parsePath(docRef.path);

  if (isSupabaseConfigured) {
    const sb = getSupabase();
    if (!sb) {
      return { exists: () => false, data: () => null, id: parsed.id };
    }
    
    try {
      if (parsed.table === 'users') {
        // Query users table or profile table safely
        const { data, error } = await sb.from('users').select('*').eq('id', parsed.id).maybeSingle();
        if (error || !data) {
          const { data: dataUid, error: errorUid } = await sb.from('users').select('*').eq('uid', parsed.id).maybeSingle();
          if (!errorUid && dataUid) {
            return { exists: () => true, data: () => dataUid, id: parsed.id };
          }
          return { exists: () => false, data: () => null, id: parsed.id };
        }
        return { exists: () => true, data: () => data, id: parsed.id };
      } else {
        const { data, error } = await sb.from('transactions').select('*').eq('id', parsed.id).single();
        if (error || !data) {
          return { exists: () => false, data: () => null, id: parsed.id };
        }
        return { exists: () => true, data: () => fromSupabasePayload(data), id: parsed.id };
      }
    } catch (err) {
      console.warn(`Error in getDoc for path ${docRef.path}`, err);
      if (parsed.table === 'users') {
        // Graceful fallback for non-vital users table
        return { exists: () => false, data: () => null, id: parsed.id };
      }
      throw err;
    }
  } else {
    if (parsed.table === 'users') {
      const userList = localDb.getUsersList();
      const found = userList.find(u => u.uid === parsed.id || u.email === parsed.id);
      if (!found) return { exists: () => false, data: () => null, id: parsed.id };
      return { exists: () => true, data: () => found, id: parsed.id };
    } else {
      const items = localDb.getTransactions(parsed.uid);
      const found = items.find(t => t.id === parsed.id);
      if (!found) {
        return { exists: () => false, data: () => null, id: parsed.id };
      }
      return { exists: () => true, data: () => found, id: parsed.id };
    }
  }
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  const parsed = parsePath(docRef.path);

  if (isSupabaseConfigured) {
    const sb = getSupabase();
    if (!sb) return;

    try {
      if (parsed.table === 'users') {
        const payload = {
          id: parsed.id,
          uid: parsed.id,
          email: data.email,
          created_at: data.createdAt || new Date().toISOString(),
          updated_at: data.updatedAt || new Date().toISOString(),
          ...data
        };
        delete (payload as any).createdAt;
        delete (payload as any).updatedAt;

        const { error } = await sb.from('users').upsert(payload, { onConflict: 'id' });
        if (error) {
          const { error: errUid } = await sb.from('users').upsert(payload, { onConflict: 'uid' });
          if (errUid) {
            console.warn("Could not upsert to users table, this is fine if user table isn't created.", errUid);
          }
        }
      } else {
        const payload = toSupabasePayload({ id: parsed.id, ...data }, parsed.uid);
        const { data: existing, error: checkError } = await sb.from('transactions').select('id').eq('id', parsed.id).maybeSingle();
        let resError;
        if (existing) {
          const { error } = await sb.from('transactions').update(payload).eq('id', parsed.id);
          resError = error;
        } else {
          const { error } = await sb.from('transactions').insert([payload]);
          resError = error;
        }
        if (resError) {
          console.warn('Upsert failed, playing fallback insert query:', resError);
          const { error: finalError } = await sb.from('transactions').insert([payload]);
          if (finalError) throw finalError;
        }
      }
    } catch (err) {
      console.error(`Error in setDoc for path ${docRef.path}`, err);
      if (parsed.table === 'users') {
        console.warn("Gracefully ignoring users write error to prevent app crash.");
        return;
      }
      throw err;
    }
  } else {
    if (parsed.table === 'users') {
      localDb.saveUserToRegistry({ uid: parsed.id, ...data });
    } else {
      const items = localDb.getTransactions(parsed.uid);
      const idx = items.findIndex(t => t.id === parsed.id);
      const updatedItem = { id: parsed.id, ...data };
      if (idx >= 0) {
        items[idx] = options?.merge ? { ...items[idx], ...data } : updatedItem;
      } else {
        items.push(updatedItem);
      }
      localDb.saveTransactions(parsed.uid, items);
    }
  }
};

export const updateDoc = async (docRef: any, data: any) => {
  const parsed = parsePath(docRef.path);

  if (isSupabaseConfigured) {
    const sb = getSupabase();
    if (!sb) return;

    try {
      if (parsed.table === 'users') {
        const payload: any = {};
        if (data.email !== undefined) payload.email = data.email;
        if (data.updatedAt !== undefined) payload.updated_at = data.updatedAt;
        
        const { error } = await sb.from('users').update(payload).eq('id', parsed.id);
        if (error) {
          await sb.from('users').update(payload).eq('uid', parsed.id);
        }
      } else {
        const partialPayload: any = {};
        if (data.title !== undefined) partialPayload.title = data.title;
        if (data.amount !== undefined) partialPayload.amount = Number(data.amount);
        if (data.type !== undefined) partialPayload.type = data.type;
        if (data.category !== undefined) partialPayload.category = data.category;
        if (data.classification !== undefined) partialPayload.classification = data.classification;
        if (data.date !== undefined) partialPayload.date = data.date;
        if (data.time !== undefined) partialPayload.time = data.time;
        if (data.isDebt !== undefined) {
          partialPayload.is_debt = data.isDebt;
          partialPayload.isDebt = data.isDebt;
        }
        if (data.debtType !== undefined) {
          partialPayload.debt_type = data.debtType;
          partialPayload.debtType = data.debtType;
        }
        if (data.isSettled !== undefined) {
          partialPayload.is_settled = data.isSettled;
          partialPayload.isSettled = data.isSettled;
        }

        const { error } = await sb.from('transactions').update(partialPayload).eq('id', parsed.id);
        if (error) throw error;
      }
    } catch (err) {
      console.error(`Error in updateDoc for path ${docRef.path}`, err);
      if (parsed.table === 'users') {
        console.warn("Gracefully ignoring users update error to prevent app crash.");
        return;
      }
      throw err;
    }
  } else {
    if (parsed.table === 'users') {
      localDb.saveUserToRegistry({ uid: parsed.id, ...data });
    } else {
      const items = localDb.getTransactions(parsed.uid);
      const idx = items.findIndex(t => t.id === parsed.id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...data };
        localDb.saveTransactions(parsed.uid, items);
      }
    }
  }
};

export const deleteDoc = async (docRef: any) => {
  const parsed = parsePath(docRef.path);

  if (isSupabaseConfigured) {
    const sb = getSupabase();
    if (!sb) return;

    try {
      const { error } = await sb.from(parsed.table).delete().eq('id', parsed.id);
      if (error && parsed.table === 'users') {
        await sb.from('users').delete().eq('uid', parsed.id);
      } else if (error) {
        throw error;
      }
    } catch (err) {
      console.error(`Error in deleteDoc for path ${docRef.path}`, err);
      if (parsed.table === 'users') {
        console.warn("Gracefully ignoring users delete error.");
        return;
      }
      throw err;
    }
  } else {
    if (parsed.table === 'users') {
      // no-op
    } else {
      const items = localDb.getTransactions(parsed.uid);
      const filtered = items.filter(t => t.id !== parsed.id);
      localDb.saveTransactions(parsed.uid, filtered);
    }
  }
};

export const getDocs = async (collRef: any) => {
  const parts = collRef.path.split('/');
  
  if (parts.length === 1 && parts[0] === 'users') {
    if (isSupabaseConfigured) {
      const sb = getSupabase();
      if (!sb) return { docs: [] };
      try {
        const { data, error } = await sb.from('users').select('*');
        if (error) {
          console.warn("Failed to get users from Supabase users table.", error);
          return { docs: [] };
        }
        return { docs: (data || []).map((u: any) => ({ id: u.id || u.uid, data: () => u })) };
      } catch (err) {
        console.warn("Gracefully ignoring users query error to prevent crash:", err);
        return { docs: [] };
      }
    } else {
      const usersList = localDb.getUsersList();
      return { docs: usersList.map(u => ({ id: u.uid, data: () => u })) };
    }
  }

  const uid = parts[1];

  if (isSupabaseConfigured) {
    const sb = getSupabase();
    if (!sb) return { docs: [] };
    
    const { data, error } = await sb
      .from('transactions')
      .select('*')
      .or(`user_id.eq.${uid},userId.eq.${uid},owner_id.eq.${uid},ownerId.eq.${uid}`);

    if (error) {
      console.warn('Supabase filter error, falling back to full table pull & client filter', error);
      const { data: rawList, error: pullError } = await sb.from('transactions').select('*');
      if (pullError) throw pullError;
      
      const filtered = (rawList || []).filter((r: any) => 
        String(r.user_id) === uid || 
        String(r.userId) === uid || 
        String(r.ownerId) === uid || 
        String(r.owner_id) === uid
      );
      return { docs: filtered.map((r: any) => ({ id: r.id, data: () => fromSupabasePayload(r) })) };
    }

    return { docs: (data || []).map((r: any) => ({ id: r.id, data: () => fromSupabasePayload(r) })) };
  } else {
    const items = localDb.getTransactions(uid);
    return { docs: items.map(t => ({ id: t.id, data: () => t })) };
  }
};

export const writeBatch = (db: any) => {
  const operations: any[] = [];
  return {
    set: (docRef: any, data: any) => {
      operations.push({ action: 'set', docRef, data });
    },
    update: (docRef: any, data: any) => {
      operations.push({ action: 'update', docRef, data });
    },
    delete: (docRef: any) => {
      operations.push({ action: 'delete', docRef });
    },
    commit: async () => {
      for (const op of operations) {
         if (op.action === 'set') {
           await setDoc(op.docRef, op.data);
         } else if (op.action === 'update') {
           await updateDoc(op.docRef, op.data);
         } else if (op.action === 'delete') {
           await deleteDoc(op.docRef);
         }
      }
    }
  };
};

export const onSnapshot = (queryOrRef: any, callback: any, onError?: any) => {
  let isCancelled = false;
  const parts = queryOrRef.path.split('/');
  const uid = parts[1];
  const isUserCol = parts.length === 1 && parts[0] === 'users';
  
  const refresh = async () => {
     if (isCancelled) return;
     try {
       const res = await getDocs(queryOrRef);
       if (!isCancelled) {
         callback(res);
       }
     } catch (e) {
       console.error("onSnapshot Poller Error:", e);
       if (onError) onError(e);
     }
  };
  
  refresh();
  const pollInterval = setInterval(refresh, 5000);
  
  let subscriptionChannel: any = null;
  if (isSupabaseConfigured && !isUserCol) {
    const sb = getSupabase();
    subscriptionChannel = sb?.channel(`public:transactions:${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, refresh)
      .subscribe();
  }
  
  return () => {
    isCancelled = true;
    clearInterval(pollInterval);
    if (subscriptionChannel && isSupabaseConfigured) {
      const sb = getSupabase();
      sb?.removeChannel(subscriptionChannel);
    }
  };
};

export const query = (ref: any, ...args: any[]) => ref;
export const where = (field: string, op: string, val: any) => ({ field, op, val });
