const fs = require('fs');
let code = fs.readFileSync('src/components/PublicBoard.tsx', 'utf8');

const badStart = code.indexOf(`  if (selectedCategory !== 'all') {`);
const badEndStr = `    });
  }`;
// Need to find the second occurrence of `    });\n  }` after badStart
const firstEnd = code.indexOf(badEndStr, badStart);
const badEnd = code.indexOf(badEndStr, firstEnd + 1) + badEndStr.length;

if (badStart > -1 && badEnd > -1) {
  const goodCode = `  if (selectedCategory !== 'all') {
    filteredItems = filteredItems.filter(i => {
      if (i.boardType === 'project') return false;
      const c = (i.category || '').toLowerCase();
      const s = selectedCategory.toLowerCase();
      if (s === 'roads' && (c.includes('road') || c.includes('transport'))) return true;
      if (s === 'water supply' && (c.includes('water') || c.includes('jal'))) return true;
      if (s === 'healthcare' && (c.includes('health') || c.includes('medic'))) return true;
      if (s === 'education/schools' && (c.includes('education') || c.includes('school'))) return true;
      if (s === 'electricity' && (c.includes('electric') || c.includes('power'))) return true;
      if (s === 'agriculture' && (c.includes('agri') || c.includes('farm'))) return true;
      return c === s;
    });
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().replace(/-/g, ' ');
    const searchTerms = q.split(/\\s+/).filter(term => term.length > 0);
    
    filteredItems = filteredItems.filter(i => {
      const text = (i.text_english || i.text_original || '').toLowerCase();
      const name = (i.name || '').toLowerCase();
      const projName = (i.name || '').toLowerCase();
      const notes = (i.notes || '').toLowerCase();
      const summary = (i.issue_summary || '').toLowerCase();
      const state = (i.state || i.state_en || '').toLowerCase();
      const district = (i.district || i.district_en || '').toLowerCase();
      const l_constituency = (i.loksabha_constituency || i.lok_sabha_en || '').toLowerCase().replace(/-/g, ' ');
      const a_constituency = (i.assembly_constituency || '').toLowerCase();
      const category = (i.category || '').toLowerCase();
      const pincode = (i.pincode || '').toLowerCase();
      const id = (i.id || '').toLowerCase();

      return searchTerms.every(term => 
        text.includes(term) ||
        name.includes(term) ||
        projName.includes(term) ||
        notes.includes(term) ||
        summary.includes(term) ||
        state.includes(term) ||
        district.includes(term) ||
        l_constituency.includes(term) ||
        a_constituency.includes(term) ||
        category.includes(term) ||
        pincode.includes(term) ||
        id.includes(term)
      );
    });
  }`;
  code = code.substring(0, badStart) + goodCode + code.substring(badEnd);
  fs.writeFileSync('src/components/PublicBoard.tsx', code);
  console.log("Fixed!");
} else {
  console.log("Could not find boundaries");
}
