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

      return transferredData
    },
    /**
     * 描述
     * @param {object} transferredData - Transferred twice Data.
     * @returns {array}
     */
    aggregate (transferredData) {
      if (!isObject(transferredData)) throw new TypeError('transferredData is not an object.')
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
    }
  }
}

/**
 * 描述 - 檢查變數是否為 object
 * @param {any} obj - 想檢查是否為 object 的變數
 * @returns {boolean}
 */
export const isObject = (obj) => {
  return Object.prototype.toString.call(obj) === '[object Object]'
}
