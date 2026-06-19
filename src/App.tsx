@@
-        // Load from sessionStorage when logged out
-        const saved = sessionStorage.getItem('blutracker_transactions');
+        // Load from sessionStorage when logged out
+        const saved = sessionStorage.getItem('blutracker_transactions');
         if (saved) {
           try {
-            setTransactions(JSON.parse(saved));
+            setTransactions(JSON.parse(saved));
           } catch (e) {
             setTransactions([]);
           }
         } else {
           setTransactions([]);
         }
