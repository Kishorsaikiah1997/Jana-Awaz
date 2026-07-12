const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'handleTrack(trackParam);',
  `// Call tracking API directly
      const fetchTrack = async (id) => {
        try {
          let q;
          if (id.startsWith('JA-')) {
            q = query(collection(db, "submissions"), where("formatted_tracking_id", "==", id));
          } else {
            q = query(collection(db, "submissions"), where("id", "==", id));
          }
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            setTrackedItem({ id: docSnap.id, ...docSnap.data() });
          } else {
            setTrackError(t("Submission not found. Please check the ID."));
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchTrack(trackParam);`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed tracking logic in App.tsx");
