define('level1value3', ['level0value1', 'level0value2'], function(level0value1, level0value2) {
  if (level0value1 !== 1) { throw new Error('level0value1 !== 1'); }
  if (level0value2 !== 2) { throw new Error('level0value2 !== 2'); }

  return level0value1 + level0value2;
});
