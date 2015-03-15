define('level2value20', ['level1value2', 'level0value2', 'level1value4', 'level1value12'],
  function(level1value2, level0value2, level1value4, level1value12) {
    if (level1value2  !== 2)  { throw new Error('level1value2  !== 2'); }
    if (level0value2  !== 2)  { throw new Error('level0value2  !== 2'); }
    if (level1value4  !== 4)  { throw new Error('level1value4  !== 4'); }
    if (level1value12 !== 12) { throw new Error('level1value12 !== 12'); }

    return level1value2 + level0value2 + level1value4 + level1value12;
  }
);