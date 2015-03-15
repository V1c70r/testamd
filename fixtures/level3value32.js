define('level3value32', ['level2value9', 'level0value1', 'level1value2', 'level2value20'],
  function(level2value9, level0value1, level1value2, level2value20) {
    if (level2value9  !== 9)  { throw new Error('level2value9  !== 9'); }
    if (level0value1  !== 1)  { throw new Error('level0value1  !== 1'); }
    if (level1value2  !== 2)  { throw new Error('level1value2  !== 2'); }
    if (level2value20 !== 20) { throw new Error('level2value20 !== 20'); }

    return level2value9 + level0value1 + level1value2 + level2value20;
  }
);