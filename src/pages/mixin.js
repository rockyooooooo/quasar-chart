export const mixin = {
  methods: {
    /**
     * 描述
     * @param {array} data - The parsedData.
     * @param {string} type
     * @returns {object}
     */
    transfer (data, type) {
      const transferredData = {}
      let typeIndex = 0
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

      data.forEach((record) => {
        if (transferredData[record[typeIndex]]) {
          transferredData[record[typeIndex]].push(record)
        } else {
          transferredData[record[typeIndex]] = [record]
        }
      })

      console.log('transferredData: ', transferredData)
      return transferredData
    },
    /**
     * 描述 - times 在 first tier，在 second transfer 後 granulate
     * @param {object} transferredData - Transferred twice Data.
     * @param {number} granularity
     * @returns {object}
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
     * @param {object} transferredData - Transferred twice Data.
     * @returns {array}
     */
    aggregate (transferredData) {
      if (!this.isObject(transferredData)) throw new TypeError('transferredData is not an object.')
      return Object.entries(transferredData)
        .map((firstTierBucket) => ([
          firstTierBucket[0],
          Object.entries(firstTierBucket[1])
            .map((secondTierBucket) => ([
              secondTierBucket[0],
              secondTierBucket[1].reduce((acc, cur) => {
                return acc + Number(cur[cur.length - 1])
              }, 0)
            ]))
        ]))
    },
    /**
     * 描述 - times 在 second tier，在 aggregate 後做 granulate
     * @param {array} aggregatedData - The aggregatedData.
     * @param {number} granularity - The user-selected granularity.
     * @returns {array}
     */
    granulateAggregatedData (aggregatedData, granularity) {
      return aggregatedData.map((firstTierBucket) => {
        // 宣告一個存放 second tier bucket 的 array
        const arr = this.times.map((time) => [time, 0])
        let index = 0

        return [
          firstTierBucket[0],
          firstTierBucket[1].reduce((acc, secondTierBucket) => {
            let timeGap = new Date(secondTierBucket[0]) - new Date(arr[index][0])
            // 當 timeGap 大等於 granularity 時就把 index + 1，並更新 timeGap，直到 timeGap 小於 granularity
            while (timeGap >= granularity * 60 * 1000) {
              timeGap = new Date(secondTierBucket[0]) - new Date(arr[++index][0])
            }
            arr[index][1] += secondTierBucket[1]
            return arr
          }, arr)
        ]
      })
    },
    /**
     * 描述
     * @param {array} times - All value of the time field of the parsedData.
     * @param {number} granularity - The user-selected granularity.
     * @returns {array}
     */
    granulateTimes (times, granularity) {
      const newTimes = [times[0]]
      times.forEach((time) => {
        if (new Date(time) - new Date(newTimes[newTimes.length - 1]) === granularity * 60 * 1000) {
          newTimes.push(time)
        }
      })
      return newTimes
    },
    /**
     * 描述 - 檢查變數是否為 object
     * @param {any} obj - 想檢查是否為 object 的變數
     * @returns {boolean}
     */
    isObject (obj) {
      return Object.prototype.toString.call(obj) === '[object Object]'
    }
  }
}
