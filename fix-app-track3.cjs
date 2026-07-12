const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ Call tracking API directly\s*const fetchTrack = async \(id\) => \{[\s\S]*?fetchTrack\(trackParam\);/m;

const replacement = `// Call tracking API directly
      const fetchTrack = async (id) => {
        setIsTrackSearching(true);
        try {
          const res = await fetch(\`/api/submissions/\${id}\`);
          const data = await res.json();
          if (data.success) {
            setTrackedItem(data.data);
          } else {
            setTrackError(t("Submission not found. Please check the ID."));
          }
        } catch (err) {
          console.error(err);
          setTrackError(t("Failed to track submission."));
        } finally {
          setIsTrackSearching(false);
        }
      };
      fetchTrack(trackParam);`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed tracking logic to use API in App.tsx");
