@@
-  const [transactions, setTransactions] = useState<Transaction[]>(() => {
-    const saved = localStorage.getItem('blutracker_transactions');
-    if (saved) {
-      try {
-        return JSON.parse(saved);
-      } catch (e) {
-        return [];
-      }
-    }
-    const hasVisited = localStorage.getItem('blutracker_visited');
-    if (!hasVisited) {
-      localStorage.setItem('blutracker_visited', 'true');
-      return INITIAL_TRANSACTIONS;
-    }
-    return [];
-  });
+  const [transactions, setTransactions] = useState<Transaction[]>(() => {
+    const saved = sessionStorage.getItem('blutracker_transactions');
+    if (saved) {
+      try {
+        return JSON.parse(saved);
+      } catch (e) {
+        return [];
+      }
+    }
+    const hasVisited = sessionStorage.getItem('blutracker_visited');
+    if (!hasVisited) {
+      sessionStorage.setItem('blutracker_visited', 'true');
+      return INITIAL_TRANSACTIONS;
+    }
+    return [];
+  });
@@
-    useEffect(() => {
-    if (authReady && !user) {
-      localStorage.setItem('blutracker_transactions', JSON.stringify(transactions));
-    }
-  }, [transactions, user, authReady]);
+    useEffect(() => {
+    if (authReady && !user) {
+      sessionStorage.setItem('blutracker_transactions', JSON.stringify(transactions));
+    }
+  }, [transactions, user, authReady]);
@@
-        const localSaved = localStorage.getItem('blutracker_transactions');
-        if (localSaved) {
-          try {
-            const localTransactions = JSON.parse(localSaved);
-            // Import to Supabase
-            localTransactions.forEach(async (t: Transaction) => {
-              await db.addTransaction(currentUser.uid, t);
-            });
-            localStorage.removeItem('blutracker_transactions');
-          } catch (e) {
-            console.error('Sync error:', e);
-          }
-        }
+        const localSaved = sessionStorage.getItem('blutracker_transactions');
+        if (localSaved) {
+          try {
+            const localTransactions = JSON.parse(localSaved);
+            // Import to Supabase
+            for (const t of localTransactions) {
+              try { await db.addTransaction(currentUser.uid, t); } catch(e){ console.error('Import tx error', e); }
+            }
+            sessionStorage.removeItem('blutracker_transactions');
+          } catch (e) {
+            console.error('Sync error:', e);
+          }
+        }
@@
-        const saved = localStorage.getItem('blutracker_transactions');
-        if (saved) {
-          try {
-            setTransactions(JSON.parse(saved));
-          } catch (e) {
-            setTransactions([]);
-          }
-        } else {
-          setTransactions([]);
-        }
+        const saved = sessionStorage.getItem('blutracker_transactions');
+        if (saved) {
+          try {
+            setTransactions(JSON.parse(saved));
+          } catch (e) {
+            setTransactions([]);
+          }
+        } else {
+          setTransactions([]);
+        }
