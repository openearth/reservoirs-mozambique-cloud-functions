// test
const assert = require('assert');
const sinon = require('sinon');
const uuid = require('uuid');

const {exportReservoirTimeSeries} = require('.');

it('exportReservoirTimeSeries: should return getInfo', () => {
  // Mock ExpressJS 'req' and 'res' parameters
  const name = uuid.v4();
  const req = {
    query: {},
    body: {
      name: name,
    },
  };

  let onSet = (o) => console.log('set: ' + o)
  let onSend = (o) => console.log('send: ' + o)

  let stubSet = sinon.stub().callsFake((o) => {
      assert.ok(o.startsWith('Access-Control'))
  })

  let stubSend = sinon.stub().callsFake(onSend)

  const res = {send: stubSend, set: stubSet};

  // Call tested function
  exportReservoirTimeSeries(req, res);

  // Verify behavior of tested function
  // assert.ok(res.send.calledOnce);

  // assert.deepStrictEqual(res.send.firstCall.args, [`Hello ${name}!`]);
});