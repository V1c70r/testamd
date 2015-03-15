define('level2value9', ['level1value3', 'level1value2', 'level1value4'],
  function(level1value3, level1value2, level1value4) {
    if (level1value3 !== 3) { throw new Error('level1value3 !== 3'); }
    if (level1value2 !== 2) { throw new Error('level1value2 !== 2'); }
    if (level1value4 !== 4) { throw new Error('level1value4 !== 4'); }

    return level1value3 + level1value2 + level1value4;
  }
);
