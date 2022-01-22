<template>
  <div style="min-width: 500px; width: 800px; max-width: 90vw;">
    <p class="caption">Single File Upload</p>
    <q-uploader
      :multiple="false"
      :url="''"
      :upload-factory="uploadFile"
      @uploaded="uploaded"
    />
    <p class="caption">User</p>
    <q-select
      v-model="user"
      :options="userOptions"
      @input="userOnChange"
    />
    <p class="caption">Granularity</p>
    <q-select
      v-model="granularity"
      :options="granularityOptions"
      @input="granularityOnChange"
    />
  </div>
</template>

<style>
.q-table-container {
  margin: 2rem 0;
}
</style>

<script>
export default {
  name: 'Test',
  data () {
    return {
      firstTier: '',
      secondTier: '',
      allTimes: [],
      times: [],
      users: [],
      nations: [],
      otts: [],
      transferredData: [],
      aggregatedData: [],
      user: '',
      userOptions: [],
      granularity: 30,
      granularityOptions: [
        { label: '5 mins', value: 5 },
        { label: '30 mins', value: 30 },
        { label: '1 hr', value: 60 },
        { label: '3 hrs', value: 60 * 3 },
        { label: '6 hrs', value: 60 * 6 },
        { label: '1 day', value: 60 * 24 }
      ]
    }
  },
  methods: {
    uploadFile (file, updateProgress) {
      return new Promise((resolve, reject) => {
        resolve(file)
      })
    },
    uploaded (file) {
      const reader = new FileReader()

      reader.onload = (evt) => {
        this.firstTier = 'users'
        this.secondTier = 'times'
        const inputData = evt.target.result

        console.time('parse data')
        const parsedData = this.parseData(inputData)
        console.timeEnd('parse data')
        // console.log('parsedData: ', parsedData)

        console.time('transfer data')
        const transferredData = this.transfer(parsedData, this.firstTier)
        console.timeEnd('transfer data')
        console.log('transferredData: ', transferredData)

        console.time('second transfer data')
        const secondTransferredData = {}
        for (const key in transferredData) {
          secondTransferredData[key] = this.transfer(transferredData[key], this.secondTier)
        }
        console.timeEnd('second transfer data')
        console.log('secondTransferredData: ', secondTransferredData)
        this.transferredData = secondTransferredData

        if (this.firstTier === 'times') {
          // times 在 first tier，在 second transfer 後 granulate
          const granulatedData = this.granulateTransferredData(secondTransferredData, this.granularity)
          const aggregatedData = this.aggregate(granulatedData)
          const dataForTable = this.transferForTable(aggregatedData)
          this.aggregatedData = aggregatedData

          console.log('granulatedData: ', granulatedData)
          console.log('aggregatedData: ', aggregatedData)
          console.log('dataForTable: ', dataForTable)
        }
        if (this.secondTier === 'times') {
          // times 在 second tier，在 aggregate 後做 granulate
          const aggregatedData = this.aggregate(secondTransferredData)
          const granulatedData = this.granulateAggregatedData(aggregatedData, this.granularity)
          const dataForTable = this.transferForTable(granulatedData)
          this.aggregatedData = granulatedData

          console.log('aggregatedData: ', aggregatedData)
          console.log('granulatedData: ', granulatedData)
          console.log('dataForTable: ', dataForTable)
        }

        // console.time('agregate data')
        // const aggregatedData = this.aggregate(secondTransferredData)
        // console.timeEnd('agregate data')
        // console.log('aggregatedData: ', aggregatedData)
        // this.aggregatedData = aggregatedData

        // const dataForTable = this.transferForTable(aggregatedData)
        // console.log('dataForTable: ', dataForTable)
      }
      reader.readAsText(file)
    },
    parseData (data) {
      const times = {}
      const users = {}
      const nations = {}
      const otts = {}

      const parsedData = data.split(/\n/)
        .filter((item) => item !== '')
        .map((item) => {
          let arr = item.split(',')
            .map((value) => value.trim())

          // 處理 OTT 含有 comma 的情況，因為會被 split，要把他 concat 回來
          // 不過目前用 hard code 的方法處理，之後可以想辦法寫的更漂亮一點
          let result = arr.length === 6
            ? arr
            : arr.slice(0, 3).concat([arr[3] + ', ' + arr[4]]).concat(arr.slice(5))

          result.forEach((field, index) => {
            if (index === 0) times[field] = true
            if (index === 1) users[field] = true
          })

          return result
        })

      for (const prop in times) {
        this.allTimes.push(prop)
      }
      // this.times = this.allTimes
      this.times = this.granulateTimes(this.allTimes, this.granularity)

      for (const prop in users) {
        this.users.push(prop)
        this.userOptions.push({ label: prop, value: prop })
      }

      for (const prop in nations) {
        this.nations.push(prop)
      }

      for (const prop in otts) {
        this.otts.push(prop)
      }

      return parsedData
    },
    transfer (parsedData, type) {
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

      parsedData.forEach((record) => {
        if (transferredData[record[typeIndex]]) {
          transferredData[record[typeIndex]].push(record)
        } else {
          transferredData[record[typeIndex]] = [record]
        }
      })

      return transferredData
    },
    aggregate (transferredData) {
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
    transferForTable (data) {
      return data.map((firstTierBucket) => {
        const row = Array(this[this.secondTier].length).fill(0)
        firstTierBucket[1].forEach((secondTierBucket) => {
          const index = this[this.secondTier].indexOf(secondTierBucket[0])
          row[index] += secondTierBucket[1]
        })
        row.push(firstTierBucket[0])
        return row
      })
    },
    userOnChange (user) {
      console.log('data for bar chart', this.aggregatedData.find((item) => item[0] === user)[1])
    },
    granularityOnChange (granularity) {
      this.times = this.granulateTimes(this.allTimes, granularity)

      if (this.firstTier === 'times') {
        // times 在 first tier，在 second transfer 後 granulate
        const granulatedData = this.granulateTransferredData(this.transferredData, granularity)
        const aggregatedData = this.aggregate(granulatedData)
        const dataForTable = this.transferForTable(aggregatedData)

        console.log('granulatedData: ', granulatedData)
        console.log('dataForTable: ', dataForTable)
      }
      if (this.secondTier === 'times') {
        // times 在 second tier，在 aggregate 後做 granulate
        const granulatedData = this.granulateAggregatedData(this.aggregatedData, granularity)
        const dataForTable = this.transferForTable(granulatedData)

        console.log('granulatedData: ', granulatedData)
        console.log('dataForTable: ', dataForTable)
      }
    },
    granulateTimes (times, granularity) {
      const newTimes = [times[0]]
      times.forEach((time) => {
        if (new Date(time) - new Date(newTimes[newTimes.length - 1]) === granularity * 60 * 1000) {
          newTimes.push(time)
        }
      })
      return newTimes
    },
    // times 在 first tier，在 second transfer 後 granulate
    granulateTransferredData (transferredData, granularity) {
      // 先把 key 都長好
      const obj = {}
      this.times.forEach((time) => {
        obj[time] = {}
        this.users.forEach((user) => {
          obj[time][user] = []
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
    // times 在 second tier，在 aggregate 後做 granulate
    granulateAggregatedData (aggregatedData, granularity) {
      console.log('=========granulateAggregatedData!=========')
      console.log(aggregatedData)
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
    }
  }
}
</script>
