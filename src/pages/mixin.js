export const mixin = {
  methods: {
    /**
     * 描述
     * @param {array} data - The parsedData.
     * @param {string} type - One of 'times', 'users', 'nations', 'otts'
     * @returns {object}
     * @example
     * input:
     *   data = [
     *     ['2021-11-01 00:00:00', '%user-5', 'i:44.215.189.28', '%Dominica', '%百度', '99526305'],
     *     ['2021-11-01 00:00:00', '%user-9', 'i:129.54.171.11', '%Panama', '%NetFlix', '11115132'],
     *     ['2021-11-01 00:05:00', '%user-9', 'i:35.8.38.102', '%Somalia', '%京東', '10601666'],
     *     ['2021-11-01 00:10:00', '%user-0', 'i:145.215.142.148', '%Mauritania', '%台灣大哥大', '200950714'],
     *     ['2021-11-01 00:15:00', '%user-3', 'i:230.79.17.46', '%Pitcairn', '%Facebook', '265328613']
     *   ]
     *   type = 'times'
     * output:
     *   transferredData = {
     *     '2021-11-01 00:00:00': [
     *       ['2021-11-01 00:00:00', '%user-5', 'i:44.215.189.28', '%Dominica', '%百度', '99526305'],
     *       ['2021-11-01 00:00:00', '%user-9', 'i:129.54.171.11', '%Panama', '%NetFlix', '11115132']
     *     ],
     *     '2021-11-01 00:05:00': [
     *       ['2021-11-01 00:05:00', '%user-9', 'i:35.8.38.102', '%Somalia', '%京東', '10601666']
     *     ],
     *     '2021-11-01 00:10:00': [
     *       ['2021-11-01 00:10:00', '%user-0', 'i:145.215.142.148', '%Mauritania', '%台灣大哥大', '200950714']
     *     ],
     *     '2021-11-01 00:15:00': [
     *       ['2021-11-01 00:15:00', '%user-3', 'i:230.79.17.46', '%Pitcairn', '%Facebook', '265328613']
     *     ]
     * }
     */
    transfer (data, type) {
      const transferredData = {}
      let typeIndex = null
      switch (type) {
        case 'times':
          typeIndex = 0
          break
        case 'users':
          typeIndex = 1
          break
        case 'nations':
          typeIndex = 3
          break
        case 'otts':
          typeIndex = 4
          break
      }

      if (!Number.isInteger(typeIndex)) throw Error("type must be one of 'times', 'users', 'nations', 'otts'")

      data.forEach((record) => {
        if (transferredData[record[typeIndex]]) {
          transferredData[record[typeIndex]].push(record)
        } else {
          transferredData[record[typeIndex]] = [record]
        }
      })

      return transferredData
    },
    /**
     * 描述 - times 在 first tier，在 second transfer 後 granulate
     * @param {object} transferredData - Expect data that has been transferred twice.
     * @param {number} granularity - The user-selected granularity, in minute. Expect 5, 30, 60, 60 * 3, 60 * 6 and 60 * 24.
     * @returns {object}
     * @example
     * input:
     *   transferredData = {
     *     '%user-0': {
     *       '2021-11-01 00:00:00': [
     *         ['2021-11-01 00:00:00', '%user-0', 'i:142.248.197.185', '%Chile', '%百度', '201347134']
     *       ],
     *       '2021-11-01 00:05:00': [
     *         ['2021-11-01 00:05:00', '%user-0', 'i:212.252.100.113', '%Croatia', '%Google', '20118528']
     *       ],
     *       '2021-11-01 00:10:00': [
     *         ['2021-11-01 00:10:00', '%user-0', 'i:145.215.142.148', '%Mauritania', '%台灣大哥大', '200950714'],
     *         ['2021-11-01 00:10:00', '%user-0', 'i:171.133.192.124', '%Western Sahara', '%騰訊', '166262990']
     *       ],
     *       '2021-11-01 00:15:00': [
     *         ['2021-11-01 00:15:00', '%user-0', 'i:148.170.25.107', '%Zimbabwe', '%Google', '234012249']
     *       ],
     *       '2021-11-01 00:20:00': [
     *         ['2021-11-01 00:20:00', '%user-0', 'i:85.17.116.72', '%French Polynesia', '%KKTV', '89999228']
     *       ],
     *       '2021-11-01 00:25:00': [
     *         ['2021-11-01 00:25:00', '%user-0', 'i:93.223.123.15', '%Martinique', '%Dailymotion', '236846183']
     *       ],
     *       '2021-11-01 00:30:00': [
     *         ['2021-11-01 00:30:00', '%user-0', 'i:122.24.169.42', '%Andorra', '%京東', '116496198']
     *       ],
     *       '2021-11-01 00:35:00': [
     *         ['2021-11-01 00:35:00', '%user-0', 'i:175.137.148.57', '%Maldives', '%Vimeo', '10113662']
     *       ]
     *     }
     *   }
     *   granularity = 30
     * output:
     *   granulatedTransferredData = {
     *     '%user-0': {
     *       '2021-11-01 00:00:00': [
     *         ['2021-11-01 00:00:00', '%user-0', 'i:142.248.197.185', '%Chile', '%百度', '201347134'],
     *         ['2021-11-01 00:05:00', '%user-0', 'i:212.252.100.113', '%Croatia', '%Google', '20118528'],
     *         ['2021-11-01 00:10:00', '%user-0', 'i:145.215.142.148', '%Mauritania', '%台灣大哥大', '200950714'],
     *         ['2021-11-01 00:10:00', '%user-0', 'i:171.133.192.124', '%Western Sahara', '%騰訊', '166262990'],
     *         ['2021-11-01 00:15:00', '%user-0', 'i:148.170.25.107', '%Zimbabwe', '%Google', '234012249'],
     *         ['2021-11-01 00:20:00', '%user-0', 'i:85.17.116.72', '%French Polynesia', '%KKTV', '89999228'],
     *         ['2021-11-01 00:25:00', '%user-0', 'i:93.223.123.15', '%Martinique', '%Dailymotion', '236846183']
     *       ],
     *       '2021-11-01 00:30:00': [
     *         ['2021-11-01 00:30:00', '%user-0', 'i:122.24.169.42', '%Andorra', '%京東', '116496198'],
     *         ['2021-11-01 00:35:00', '%user-0', 'i:175.137.148.57', '%Maldives', '%Vimeo', '10113662']
     *       ]
     *     }
     *   }
     */
    granulateTransferredData (transferredData, granularity) {
      const secondTier = this.secondTier
      // 先把 key 都長好
      const obj = {}
      this.times.forEach((time) => {
        obj[time] = {}
        this[secondTier].forEach((secondTierKey) => {
          obj[time][secondTierKey] = []
        })
      })
      let index = 0
      for (const firstTier in transferredData) {
        let timeGap = new Date(firstTier) - new Date(this.times[index])
        while (timeGap >= granularity * 60 * 1000) {
          timeGap = new Date(firstTier) - new Date(this.times[++index])
        }
        for (const secondTier in transferredData[firstTier]) {
          obj[this.times[index]][secondTier] = [...obj[this.times[index]][secondTier], ...transferredData[firstTier][secondTier]]
        }
      }
      return obj
    },
    /**
     * 描述
     * @param {object} transferredData - Expected data that has been transferred twice.
     * @param {number} granularity - The user-selected granularity, in minute. Expect 5, 30, 60, 60 * 3, 60 * 6 and 60 * 24.
     * @returns {array}
     * @example
     * input:
     *   transferredData = {
     *     '%user-0': {
     *       '2021-11-01 00:00:00': [
     *         ['2021-11-01 00:00:00', '%user-0', 'i:142.248.197.185', '%Chile', '%百度', '201347134']
     *       ],
     *       '2021-11-01 00:05:00': [
     *         ['2021-11-01 00:05:00', '%user-0', 'i:212.252.100.113', '%Croatia', '%Google', '20118528']
     *       ],
     *       '2021-11-01 00:10:00': [
     *         ['2021-11-01 00:10:00', '%user-0', 'i:145.215.142.148', '%Mauritania', '%台灣大哥大', '200950714'],
     *         ['2021-11-01 00:10:00', '%user-0', 'i:171.133.192.124', '%Western Sahara', '%騰訊', '166262990']
     *       ]
     *     },
     *     '%user-1': {
     *       '2021-11-01 00:00:00': [
     *         ['2021-11-01 00:00:00', '%user-1', 'i:148.170.25.107', '%Zimbabwe', '%Google', '234012249']
     *       ],
     *       '2021-11-01 00:10:00': [
     *         ['2021-11-01 00:10:00', '%user-1', 'i:85.17.116.72', '%French Polynesia', '%KKTV', '89999228']
     *       ],
     *       '2021-11-01 00:15:00': [
     *         ['2021-11-01 00:15:00', '%user-1', 'i:93.223.123.15', '%Martinique', '%Dailymotion', '236846183']
     *       ]
     *     },
     *     '%user-2': {
     *       '2021-11-01 00:05:00': [
     *         ['2021-11-01 00:05:00', '%user-2', 'i:122.24.169.42', '%Andorra', '%京東', '116496198']
     *       ],
     *       '2021-11-01 00:15:00': [
     *         ['2021-11-01 00:15:00', '%user-2', 'i:175.137.148.57', '%Maldives', '%Vimeo', '10113662']
     *       ]
     *     }
     *   }
     *   granularity = 5
     * output:
     *   aggregatedData = [
     *     ['%user-0', [
     *       ['2021-11-01 00:00:00', 201347134],
     *       ['2021-11-01 00:05:00', 20118528],
     *       ['2021-11-01 00:10:00', 367213704] // 200950714 + 166262990
     *     ]],
     *     ['%user-1', [
     *       ['2021-11-01 00:00:00', 234012249],
     *       ['2021-11-01 00:10:00', 89999228],
     *       ['2021-11-01 00:15:00', 236846183]
     *     ]],
     *     ['%user-2', [
     *       ['2021-11-01 00:05:00', 116496198],
     *       ['2021-11-01 00:15:00', 10113662]
     *     ]]
     *   ]
     */
    aggregate (transferredData, granularity = 5) {
      if (!isObject(transferredData)) throw new TypeError('transferredData is not an object.')
      return Object.entries(transferredData)
        .map((firstTierBucket) => {
          // TODO: bps 計算方式應該還可以改善
          const totalBits = Object.entries(firstTierBucket[1])
            .map((secondTierBucket) => ([
              secondTierBucket[0],
              secondTierBucket[1].reduce((acc, cur) => {
                return acc + (Number(cur[cur.length - 1]) * 5 * 60)
              }, 0)
            ]))
          const bps = totalBits.map((secondTierBucket) => [
            secondTierBucket[0],
            Math.round(secondTierBucket[1] / (granularity * 60))
          ])
          return [
            firstTierBucket[0],
            bps
          ]
        })
    },
    /**
     * 描述 - times 在 second tier，在 aggregate 後做 granulate
     * @param {array} aggregatedData - The aggregatedData.
     * @param {number} granularity - The user-selected granularity, in minute.  Expect 5, 30, 60, 60 * 3, 60 * 6 and 60 * 24.
     * @returns {array}
     * @example
     * input:
     *   aggregatedData = [
     *     ['%user-0', [
     *       ['2021-11-01 00:00:00', 201347134],
     *       ['2021-11-01 00:05:00', 20118528],
     *       ['2021-11-01 00:10:00', 367213704]
     *     ]],
     *     ['%user-1', [
     *       ['2021-11-01 00:00:00', 234012249],
     *       ['2021-11-01 00:10:00', 89999228],
     *       ['2021-11-01 00:15:00', 236846183]
     *     ]],
     *     ['%user-2', [
     *       ['2021-11-01 00:05:00', 116496198],
     *       ['2021-11-01 00:15:00', 10113662]
     *     ]]
     *   ]
     *   granularity = 30
     * output:
     *   granulatedAggregatedData = [
     *     ['%user-0', [
     *       ['2021-11-01 00:00:00', 201347134 + 20118528 + 367213704 + 234012249 + 89999228 + 236846183],
     *       ['2021-11-01 00:30:00', 116496198 + 10113662]
     *     ]]
     *   ]
     */
    granulateAggregatedData (aggregatedData, granularity) {
      return aggregatedData.map((firstTierBucket) => {
        // 宣告一個存放 second tier bucket 的 array
        const arr = this.times.map((time) => [time, 0])
        let index = 0

        // TODO: bps 計算方式應該還可以改善
        const totalBits = firstTierBucket[1].reduce((acc, secondTierBucket) => {
          let timeGap = new Date(secondTierBucket[0]) - new Date(arr[index][0])
          // 當 timeGap 大等於 granularity 時就把 index + 1，並更新 timeGap，直到 timeGap 小於 granularity
          while (timeGap >= granularity * 60 * 1000) {
            timeGap = new Date(secondTierBucket[0]) - new Date(arr[++index][0])
          }
          arr[index][1] += (secondTierBucket[1] * 5 * 60)
          return arr
        }, arr)

        const bps = totalBits.map((secondTierBucket) => [
          secondTierBucket[0],
          Math.round(secondTierBucket[1] / (granularity * 60))
        ])

        return [
          firstTierBucket[0],
          bps
        ]
      })
    },
    /**
     * 描述
     * @param {array} times - All value of the time field of the parsedData.
     * @param {number} granularity - The user-selected granularity, in minute.  Expect 5, 30, 60, 60 * 3, 60 * 6 and 60 * 24.
     * @returns {array}
     * @example
     * input:
     *   times = [
     *     '2021-11-01 00:00:00',
     *     '2021-11-01 00:05:00',
     *     '2021-11-01 00:10:00',
     *     '2021-11-01 00:15:00',
     *     '2021-11-01 00:20:00',
     *     '2021-11-01 00:25:00',
     *     '2021-11-01 00:30:00',
     *     '2021-11-01 00:35:00',
     *     '2021-11-01 00:40:00',
     *     '2021-11-01 00:45:00',
     *     '2021-11-01 00:50:00',
     *     '2021-11-01 00:55:00',
     *     '2021-11-01 01:00:00',
     *     '2021-11-01 01:05:00',
     *     '2021-11-01 01:10:00',
     *     '2021-11-01 01:15:00',
     *     '2021-11-01 01:20:00',
     *     '2021-11-01 01:25:00',
     *     '2021-11-01 01:30:00',
     *     '2021-11-01 01:35:00',
     *     '2021-11-01 01:40:00',
     *     '2021-11-01 01:45:00',
     *     '2021-11-01 01:50:00',
     *     '2021-11-01 01:55:00'
     *   ]
     *   granularity = 30
     * output:
     *   granulatedTimes = [
     *     '2021-11-01 00:00:00',
     *     '2021-11-01 00:30:00',
     *     '2021-11-01 01:00:00',
     *     '2021-11-01 01:30:00'
     *   ]
     */
    granulateTimes (times, granularity) {
      if (granularity <= 0) throw Error('granularity must be greater than 0')
      if (!Array.isArray(times)) throw TypeError('times must be an array')
      if (!times.length) return []

      const newTimes = [times[0]]
      times.forEach((time) => {
        if (new Date(time) - new Date(newTimes[newTimes.length - 1]) === Math.floor(granularity) * 60 * 1000) {
          newTimes.push(time)
        }
      })
      return newTimes
    }
  }
}

/**
 * 描述 - 檢查變數是否為 object
 * @param {any} item - 任何想檢查是否為 object 的東西
 * @returns {boolean}
 */
export const isObject = (item) => {
  return Object.prototype.toString.call(item) === '[object Object]'
}
