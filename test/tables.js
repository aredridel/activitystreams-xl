const tape = require('tape');
const tables = require('../tables');

tape.test('table indexes are correct size', t => {
    t.equal(tables.allTypes.length, tables.byURI.length, 'indexed by uri are equal to indexed by name');
    t.end();
});
