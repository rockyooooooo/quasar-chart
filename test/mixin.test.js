const { describe, test, expect } = require('@jest/globals')
const { mixin } = require('./mixin')
const { methods } = mixin
const { transfer, aggregate } = methods

describe('transfer', () => {
  const data = [
    ['2021-11-01 00:00:00', '%user-5', 'i:44.215.189.28', '%Dominica', '%百度', '99526305'],
    ['2021-11-01 00:00:00', '%user-9', 'i:129.54.171.11', '%Panama', '%NetFlix', '11115132'],
    ['2021-11-01 00:05:00', '%user-9', 'i:35.8.38.102', '%Somalia', '%京東', '10601666'],
    ['2021-11-01 00:10:00', '%user-0', 'i:145.215.142.148', '%Mauritania', '%台灣大哥大', '200950714'],
    ['2021-11-01 00:15:00', '%user-3', 'i:230.79.17.46', '%Pitcairn', '%Facebook', '265328613']
  ]
  test('transfer an array of arrays to be an object', () => {
    expect(transfer(data, 'times')).toBeInstanceOf(Object)
    expect(transfer(data, 'users')).toBeInstanceOf(Object)
    expect(transfer(data, 'nations')).toBeInstanceOf(Object)
    expect(transfer(data, 'otts')).toBeInstanceOf(Object)
  })
  test('transfer an array of arrays to have relative keys', () => {
    expect(transfer(data, 'times')).toEqual({
      '2021-11-01 00:00:00': expect.any(Array),
      '2021-11-01 00:05:00': expect.any(Array),
      '2021-11-01 00:10:00': expect.any(Array),
      '2021-11-01 00:15:00': expect.any(Array)
    })
    expect(transfer(data, 'users')).toEqual({
      '%user-5': expect.any(Array),
      '%user-9': expect.any(Array),
      '%user-0': expect.any(Array),
      '%user-3': expect.any(Array)
    })
    expect(transfer(data, 'nations')).toEqual({
      '%Dominica': expect.any(Array),
      '%Panama': expect.any(Array),
      '%Somalia': expect.any(Array),
      '%Mauritania': expect.any(Array),
      '%Pitcairn': expect.any(Array)
    })
    expect(transfer(data, 'otts')).toEqual({
      '%百度': expect.any(Array),
      '%NetFlix': expect.any(Array),
      '%京東': expect.any(Array),
      '%台灣大哥大': expect.any(Array),
      '%Facebook': expect.any(Array)
    })
  })

  test('transfer null will throw TypeError', () => {
    expect(() => transfer(null, 'users')).toThrow(TypeError)
  })
  test('transfer undefined will throw TypeError', () => {
    expect(() => transfer(undefined, 'users')).toThrow(TypeError)
  })
  test('transfer object will throw TypeError', () => {
    expect(() => transfer({}, 'users')).toThrow(TypeError)
  })
})

describe('aggregate', () => {
  const data = {
    '%user-0': {
      '2021-11-01 00:00:00': [
        ['2021-11-01 00:00:00', '%user-0', 'i:142.248.197.185', '%Chile', '%百度', '201347134']
      ],
      '2021-11-01 00:05:00': [
        ['2021-11-01 00:05:00', '%user-0', 'i:212.252.100.113', '%Croatia', '%Google', '20118528']
      ],
      '2021-11-01 00:10:00': [
        ['2021-11-01 00:10:00', '%user-0', 'i:145.215.142.148', '%Mauritania', '%台灣大哥大', '200950714'],
        ['2021-11-01 00:10:00', '%user-0', 'i:171.133.192.124', '%Western Sahara', '%騰訊', '166262990']
      ]
    },
    '%user-1': {
      '2021-11-01 00:00:00': [
        ['2021-11-01 00:00:00', '%user-1', 'i:148.170.25.107', '%Zimbabwe', '%Google', '234012249']
      ],
      '2021-11-01 00:10:00': [
        ['2021-11-01 00:10:00', '%user-1', 'i:85.17.116.72', '%French Polynesia', '%KKTV', '89999228']
      ],
      '2021-11-01 00:15:00': [
        ['2021-11-01 00:15:00', '%user-1', 'i:93.223.123.15', '%Martinique', '%Dailymotion', '236846183']
      ]
    },
    '%user-2': {
      '2021-11-01 00:05:00': [
        ['2021-11-01 00:05:00', '%user-2', 'i:122.24.169.42', '%Andorra', '%京東', '116496198']
      ],
      '2021-11-01 00:15:00': [
        ['2021-11-01 00:15:00', '%user-2', 'i:175.137.148.57', '%Maldives', '%Vimeo', '10113662']
      ]
    }
  }
  test('aggregate an object of arrays to be an array', () => {
    expect(aggregate(data)).toBeInstanceOf(Array)
  })
  test('aggregate an object of arrays to have the bps aggregated by the same key', () => {
    expect(aggregate(data)).toEqual([
      ['%user-0', [
        ['2021-11-01 00:00:00', 201347134],
        ['2021-11-01 00:05:00', 20118528],
        ['2021-11-01 00:10:00', 200950714 + 166262990]
      ]],
      ['%user-1', [
        ['2021-11-01 00:00:00', 234012249],
        ['2021-11-01 00:10:00', 89999228],
        ['2021-11-01 00:15:00', 236846183]
      ]],
      ['%user-2', [
        ['2021-11-01 00:05:00', 116496198],
        ['2021-11-01 00:15:00', 10113662]
      ]]
    ])
  })

  test('aggregate null will throw TypeError', () => {
    expect(() => aggregate(null)).toThrow(TypeError)
  })
  test('aggregate undefined will throw TypeError', () => {
    expect(() => aggregate(undefined)).toThrow(TypeError)
  })
  test('aggregate array will throw TypeError', () => {
    expect(() => aggregate([])).toThrow(TypeError)
  })
})
