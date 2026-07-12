const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace('ClipboardList\n} from "lucide-react";', 'ClipboardList,\n  LogOut\n} from "lucide-react";');

// Fix first logout button
code = code.replace(
  '<span className="hidden sm:inline">{String(t("Logout"))}</span>\\n              </button>',
  '<LogOut className="w-4 h-4" />\\n                <span className="hidden sm:inline">{String(t("Logout"))}</span>\\n              </button>'
);

// We need a regex or string split to fix both.
const parts = code.split('<span className="hidden sm:inline">{String(t("Logout"))}</span>');
if (parts.length === 3) { // 2 occurrences
  code = parts[0] + '<LogOut className="w-3.5 h-3.5" />\n                <span className="hidden sm:inline">{String(t("Logout"))}</span>' + parts[1] + '<LogOut className="w-3.5 h-3.5" />\n                <span className="hidden sm:inline">{String(t("Logout"))}</span>' + parts[2];
}

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed Logout icons in App.tsx");
