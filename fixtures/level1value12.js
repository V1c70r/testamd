define('level1value12', ['level0value4', 'level0value8'], function(level0value4, level0value8) {
  if (level0value4 !== 4) { throw new Error('level0value4 !== 4'); }
  if (level0value8 !== 8) { throw new Error('level0value8 !== 8'); }

  return level0value4 + level0value8;
});
