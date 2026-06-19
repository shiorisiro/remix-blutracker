@@
-    // Initial fetch
-    this.getTransactions(userId).then(callback);
+    // Initial fetch
+    this.getTransactions(userId).then(callback);
 
     // Realtime subscription
     const channel = supabase
       .channel(`transactions_${userId}`)
       .on('postgres_changes',
-        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
+        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
         () => this.getTransactions(userId).then(callback)
       )
       .subscribe();
