const { describe, test, expect } = require('@jest/globals')
const { mixin, isObject } = require('./mixin')
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
  describe('合法輸入', () => {
    test('傳入正常 input，得到物件', () => {
      expect(transfer(data, 'times')).toBeInstanceOf(Object)
      expect(transfer(data, 'users')).toBeInstanceOf(Object)
      expect(transfer(data, 'nations')).toBeInstanceOf(Object)
      expect(transfer(data, 'otts')).toBeInstanceOf(Object)
    })
    test('傳入正常 input，得到預期物件', () => {
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
    test('傳入空陣列跟空字串回傳空物件', () => {
      expect(transfer([], '')).toEqual({})
    })
    test('傳入的陣列的每個 record 的長度不足，不影響執行', () => {
      const newData = data.map((record) => record.filter((item, index) => index < 5))
      expect(transfer(newData, 'times')).toEqual({
        '2021-11-01 00:00:00': expect.any(Array),
        '2021-11-01 00:05:00': expect.any(Array),
        '2021-11-01 00:10:00': expect.any(Array),
        '2021-11-01 00:15:00': expect.any(Array)
      })
    })
  })
  describe('非法輸入', () => {
    test('傳入 null 會 throw TypeError', () => {
      expect(() => transfer(null, 'users')).toThrow(TypeError)
    })
    test('傳入 undefined 會 throw TypeError', () => {
      expect(() => transfer(undefined, 'users')).toThrow(TypeError)
    })
    test('傳入 object 會 throw TypeError', () => {
      expect(() => transfer({}, 'users')).toThrow(TypeError)
    })
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
  describe('合法輸入', () => {
    test('傳入正常物件，得到陣列', () => {
      expect(aggregate(data)).toBeInstanceOf(Array)
    })
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
  })
  describe('非法輸入', () => {
    test('傳入 null 會 throw TypeError', () => {
      expect(() => aggregate(null)).toThrow(TypeError)
    })
    test('傳入 undefined 會 throw TypeError', () => {
      expect(() => aggregate(undefined)).toThrow(TypeError)
    })
    test('傳入 array 會 throw TypeError', () => {
      expect(() => aggregate([])).toThrow(TypeError)
    })
  })
})

describe('isObject', () => {
  test('物件 -> true', () => {
    expect(isObject({})).toBe(true)
  })
  test('陣列 -> false', () => {
    expect(isObject([])).toBe(false)
  })
  test('數字 -> false', () => {
    expect(isObject(123)).toBe(false)
  })
  test('字串 -> false', () => {
    expect(isObject('123')).toBe(false)
  })
  test('NaN -> false', () => {
    expect(isObject(NaN)).toBe(false)
  })
  test('布林 -> false', () => {
    expect(isObject(true)).toBe(false)
  })
  test('null -> false', () => {
    expect(isObject(null)).toBe(false)
  })
  test('undefined -> false', () => {
    expect(isObject(undefined)).toBe(false)
  })
})
