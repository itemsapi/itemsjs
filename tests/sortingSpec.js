import assert from 'node:assert';
import { sorted_items } from '../src/lib.js';
import { map } from 'lodash-es';

describe('aggregations', function () {
  const items = [
    {
      name: 'movie1',
      date: '2018-12-03',
    },
    {
      name: 'movie7',
      date: '2018-12-01',
    },
    {
      name: 'movie3',
      date: '2018-12-02',
    },
    {
      name: 'movie2',
      date: '2018-12-01',
    },
  ];

  it('makes items sorting', function test(done) {
    const sortings = {
      name_asc: {
        field: 'name',
        order: 'asc',
      },
      name_desc: {
        field: 'name',
        order: 'desc',
      },
      date_asc: {
        field: ['date', 'name'],
        order: ['asc', 'asc'],
      },
    };

    let result = sorted_items(items, 'name_asc', sortings);
    assert.deepEqual(map(result, 'name'), [
      'movie1',
      'movie2',
      'movie3',
      'movie7',
    ]);

    result = sorted_items(items, 'name_desc', sortings);
    assert.deepEqual(
      map(result, 'name'),
      ['movie1', 'movie2', 'movie3', 'movie7'].reverse()
    );

    result = sorted_items(items, 'date_asc', sortings);
    assert.deepEqual(map(result, 'name'), [
      'movie2',
      'movie7',
      'movie3',
      'movie1',
    ]);

    const customSort = {
      field: ['date', 'name'],
      order: ['desc', 'desc'],
    };

    result = sorted_items(items, customSort);
    assert.deepEqual(map(result, 'name'), [
      'movie1',
      'movie3',
      'movie7',
      'movie2',
    ]);
    done();
  });
});
