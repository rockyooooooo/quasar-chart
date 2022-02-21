const { describe, test, expect } = require('@jest/globals')
const { mixin, isObject } = require('../src/pages/mixin')
const { methods } = mixin
const { transfer, aggregate, granulateTimes } = methods

describe('transfer', () => {
  const data = [
    ['2021-11-01 00:00:00', '%user-5', 'i:44.215.189.28', '%Dominica', '%百度', '99526305'],
    ['2021-11-01 00:00:00', '%user-9', 'i:129.54.171.11', '%Panama', '%NetFlix', '11115132'],
    ['2021-11-01 00:05:00', '%user-9', 'i:35.8.38.102', '%Somalia', '%京東', '10601666'],
    ['2021-11-01 00:10:00', '%user-0', 'i:145.215.142.148', '%Mauritania', '%台灣大哥大', '200950714'],
    ['2021-11-01 00:15:00', '%user-3', 'i:230.79.17.46', '%Pitcairn', '%Facebook', '265328613']
  ]

  test('傳入正常 input，得到預期物件', () => {
    expect(transfer(data, 'times')).toEqual({
      '2021-11-01 00:00:00': [
        ['2021-11-01 00:00:00', '%user-5', 'i:44.215.189.28', '%Dominica', '%百度', '99526305'],
        ['2021-11-01 00:00:00', '%user-9', 'i:129.54.171.11', '%Panama', '%NetFlix', '11115132']
      ],
      '2021-11-01 00:05:00': [
        ['2021-11-01 00:05:00', '%user-9', 'i:35.8.38.102', '%Somalia', '%京東', '10601666']
      ],
      '2021-11-01 00:10:00': [
        ['2021-11-01 00:10:00', '%user-0', 'i:145.215.142.148', '%Mauritania', '%台灣大哥大', '200950714']
      ],
      '2021-11-01 00:15:00': [
        ['2021-11-01 00:15:00', '%user-3', 'i:230.79.17.46', '%Pitcairn', '%Facebook', '265328613']
      ]
    })
    expect(transfer(data, 'users')).toEqual({
      '%user-5': [
        ['2021-11-01 00:00:00', '%user-5', 'i:44.215.189.28', '%Dominica', '%百度', '99526305']
      ],
      '%user-9': [
        ['2021-11-01 00:00:00', '%user-9', 'i:129.54.171.11', '%Panama', '%NetFlix', '11115132'],
        ['2021-11-01 00:05:00', '%user-9', 'i:35.8.38.102', '%Somalia', '%京東', '10601666']
      ],
      '%user-0': [
        ['2021-11-01 00:10:00', '%user-0', 'i:145.215.142.148', '%Mauritania', '%台灣大哥大', '200950714']
      ],
      '%user-3': [
        ['2021-11-01 00:15:00', '%user-3', 'i:230.79.17.46', '%Pitcairn', '%Facebook', '265328613']
      ]
    })
    expect(transfer(data, 'nations')).toEqual({
      '%Dominica': [
        ['2021-11-01 00:00:00', '%user-5', 'i:44.215.189.28', '%Dominica', '%百度', '99526305']
      ],
      '%Panama': [
        ['2021-11-01 00:00:00', '%user-9', 'i:129.54.171.11', '%Panama', '%NetFlix', '11115132']
      ],
      '%Somalia': [
        ['2021-11-01 00:05:00', '%user-9', 'i:35.8.38.102', '%Somalia', '%京東', '10601666']
      ],
      '%Mauritania': [
        ['2021-11-01 00:10:00', '%user-0', 'i:145.215.142.148', '%Mauritania', '%台灣大哥大', '200950714']
      ],
      '%Pitcairn': [
        ['2021-11-01 00:15:00', '%user-3', 'i:230.79.17.46', '%Pitcairn', '%Facebook', '265328613']
      ]
    })
    expect(transfer(data, 'otts')).toEqual({
      '%百度': [
        ['2021-11-01 00:00:00', '%user-5', 'i:44.215.189.28', '%Dominica', '%百度', '99526305']
      ],
      '%NetFlix': [
        ['2021-11-01 00:00:00', '%user-9', 'i:129.54.171.11', '%Panama', '%NetFlix', '11115132']
      ],
      '%京東': [
        ['2021-11-01 00:05:00', '%user-9', 'i:35.8.38.102', '%Somalia', '%京東', '10601666']
      ],
      '%台灣大哥大': [
        ['2021-11-01 00:10:00', '%user-0', 'i:145.215.142.148', '%Mauritania', '%台灣大哥大', '200950714']
      ],
      '%Facebook': [
        ['2021-11-01 00:15:00', '%user-3', 'i:230.79.17.46', '%Pitcairn', '%Facebook', '265328613']
      ]
    })
  })

  test('傳入空陣列回傳空物件', () => {
    expect(transfer([], 'times')).toEqual({})
    expect(transfer([], 'users')).toEqual({})
    expect(transfer([], 'nations')).toEqual({})
    expect(transfer([], 'otts')).toEqual({})
  })

  test('傳入的 data 非 array 會 throw TypeError', () => {
    expect(() => transfer(null, 'users')).toThrow(TypeError)
    expect(() => transfer(undefined, 'users')).toThrow(TypeError)
    expect(() => transfer({}, 'users')).toThrow(TypeError)
    expect(() => transfer(1, 'users')).toThrow(TypeError)
    expect(() => transfer('1', 'users')).toThrow(TypeError)
    expect(() => transfer(true, 'users')).toThrow(TypeError)
  })

  test("傳入的 type 不是 'times', 'users', 'nations', 'otts' 其中一個，會 throw Error", () => {
    expect(() => transfer(data, 'test')).toThrowError("type must be one of 'times', 'users', 'nations', 'otts'")
    expect(() => transfer(data, '')).toThrowError("type must be one of 'times', 'users', 'nations', 'otts'")
    expect(() => transfer(data, 100)).toThrowError("type must be one of 'times', 'users', 'nations', 'otts'")
    expect(() => transfer(data, [])).toThrowError("type must be one of 'times', 'users', 'nations', 'otts'")
    expect(() => transfer(data, {})).toThrowError("type must be one of 'times', 'users', 'nations', 'otts'")
    expect(() => transfer(data, null)).toThrowError("type must be one of 'times', 'users', 'nations', 'otts'")
    expect(() => transfer(data, undefined)).toThrowError("type must be one of 'times', 'users', 'nations', 'otts'")
  })
})

describe('isObject', () => {
  test('物件 -> true', () => {
    expect(isObject({})).toBe(true)
  })

  test('非物件 -> false', () => {
    expect(isObject([])).toBe(false)
    expect(isObject(123)).toBe(false)
    expect(isObject('123')).toBe(false)
    expect(isObject(NaN)).toBe(false)
    expect(isObject(true)).toBe(false)
    expect(isObject(null)).toBe(false)
    expect(isObject(undefined)).toBe(false)
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

  test('傳入正常物件，得到預期陣列', () => {
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

  test('傳入空物件，得到空陣列', () => {
    expect(aggregate({})).toEqual([])
  })

  test('transferredData 不是傳入物件，會 throw TypeError', () => {
    expect(() => aggregate(null)).toThrow(TypeError)
    expect(() => aggregate(undefined)).toThrow(TypeError)
    expect(() => aggregate([])).toThrow(TypeError)
    expect(() => aggregate(100)).toThrow(TypeError)
    expect(() => aggregate('test')).toThrow(TypeError)
    expect(() => aggregate(true)).toThrow(TypeError)
    expect(() => aggregate(false)).toThrow(TypeError)
  })
})

describe('granulateTimes', () => {
  const times = [
    '2021-11-01 00:00:00',
    '2021-11-01 00:05:00',
    '2021-11-01 00:10:00',
    '2021-11-01 00:15:00',
    '2021-11-01 00:20:00',
    '2021-11-01 00:25:00',
    '2021-11-01 00:30:00',
    '2021-11-01 00:35:00',
    '2021-11-01 00:40:00',
    '2021-11-01 00:45:00',
    '2021-11-01 00:50:00',
    '2021-11-01 00:55:00',
    '2021-11-01 01:00:00',
    '2021-11-01 01:05:00',
    '2021-11-01 01:10:00',
    '2021-11-01 01:15:00',
    '2021-11-01 01:20:00',
    '2021-11-01 01:25:00',
    '2021-11-01 01:30:00',
    '2021-11-01 01:35:00',
    '2021-11-01 01:40:00',
    '2021-11-01 01:45:00',
    '2021-11-01 01:50:00',
    '2021-11-01 01:55:00'
  ]

  describe('granularity 是整數', () => {
    test('granularity 是 5 mins', () => {
      expect(granulateTimes(times, 5).length).toBe(24)
    })

    test('granularity 是 30 mins', () => {
      expect(granulateTimes(times, 30).length).toBe(4)
    })

    test('granularity 是 1 hr', () => {
      expect(granulateTimes(times, 60).length).toBe(2)
    })
  })

  describe('granularity 不是整數', () => {
    test('granularity 傳入 5.12', () => {
      expect(granulateTimes(times, 5.12).length).toBe(24)
    })

    test('granularity 傳入 30.12', () => {
      expect(granulateTimes(times, 30.12).length).toBe(4)
    })

    test('granularity 傳入 60.12', () => {
      expect(granulateTimes(times, 60.12).length).toBe(2)
    })
  })

  test('times 傳入空陣列, 回傳空陣列', () => {
    expect(granulateTimes([], 5)).toEqual([])
  })

  test('times 傳入非 array 會 throw TypeError', () => {
    expect(() => granulateTimes({}, 5)).toThrow(TypeError)
    expect(() => granulateTimes(null, 5)).toThrow(TypeError)
    expect(() => granulateTimes(undefined, 5)).toThrow(TypeError)
    expect(() => granulateTimes(100, 5)).toThrow(TypeError)
    expect(() => granulateTimes('100', 5)).toThrow(TypeError)
    expect(() => granulateTimes(true, 5)).toThrow(TypeError)
  })

  test('granularity 傳入小於或等於 0 的數字會 throw Error', () => {
    expect(() => granulateTimes(times, 0)).toThrowError('granularity must be greater than 0')
    expect(() => granulateTimes(times, -1)).toThrowError('granularity must be greater than 0')
  })
})
