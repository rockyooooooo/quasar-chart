/**
 * 描述
 * @param {array} data - The parsedData.
 * @param {string} type
 * @returns {object}
 */
export const transfer = (data, type) => {
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
}

/**
 * 描述
 * @param {object} transferredData - Transferred twice Data.
 * @returns {array}
 */
export const aggregate = (transferredData) => {
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
