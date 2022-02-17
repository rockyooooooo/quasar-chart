<template>
  <div style="min-width: 500px; width: 800px; max-width: 90vw;">
    <p class="caption">Single File Upload</p>
    <q-uploader
      id="uploader"
      :multiple="false"
      :url="''"
      :upload-factory="uploadFile"
      @uploaded="uploaded"
    />
    <p class="caption">Type</p>
    <q-select
      id="type-selector"
      v-model="type"
      :options="typeOptions"
      :disable="isTypeSelectDisabled"
    />
    <p class="caption">Granularity</p>
    <q-select
      id="granularity-selector"
      v-model="granularity"
      :options="granularityOptions"
      :disable="isGranularitySelectDisabled"
    />
    <q-table
      id="table"
      class="q-mt-lg"
      :data="dataForTable"
      :columns="columns"
      row-key="name"
    />
    <q-btn
      id="flip-btn"
      @click="handleFlip"
      :disable="isFlipDisabled"
    >
    Flip
    </q-btn>
  </div>
</template>

<script>
import { Loading } from 'quasar'
import { mixin } from './mixin'

export default {
  name: 'TableChart',
  data () {
    return {
      inputData: '',
      firstTier: 'times',
      secondTier: 'users',
      type: 'users',
      typeOptions: [
        { label: 'User', value: 'users' },
        { label: 'Nation', value: 'nations' },
        { label: 'OTT Service', value: 'otts' }
      ],
      isTypeSelectDisabled: true,
      granularity: 5,
      granularityOptions: [
        { label: '5 mins', value: 5 },
        { label: '30 mins', value: 30 },
        { label: '1 hr', value: 60 },
        { label: '3 hrs', value: 60 * 3 },
        { label: '6 hrs', value: 60 * 6 },
        { label: '1 day', value: 60 * 24 }
      ],
      isGranularitySelectDisabled: true,
      allTimes: [],
      users: [],
      nations: [],
      otts: [],
      isFlipDisabled: true,
      isFlipped: false
    }
  },
  computed: {
    parsedData () {
      return this.parseData(this.inputData)
    },
    transferredData () {
      if (!this.parsedData.length) return
      const transferredData = this.transfer(this.parsedData, this.firstTier)

      const secondTransferredData = {}
      for (const key in transferredData) {
        secondTransferredData[key] = this.transfer(transferredData[key], this.secondTier)
      }
      return secondTransferredData
    },
    times () {
      return this.granulateTimes(this.allTimes, this.granularity)
    },
    dataForTable () {
      let aggregatedAndGranulatedData = []
      if (this.firstTier === 'times') {
        const granulatedData = this.granulateTransferredData(this.transferredData, this.granularity)
        aggregatedAndGranulatedData = this.aggregate(granulatedData)
      }
      if (this.secondTier === 'times') {
        const aggregatedData = this.aggregate(this.transferredData)
        aggregatedAndGranulatedData = this.granulateAggregatedData(aggregatedData, this.granularity)
      }

      return this.transferForTable(aggregatedAndGranulatedData)
    },
    columns () {
      if (!this.parsedData.length) return []
      const columnsValue = this[this.secondTier]

      const columns = []
      columns.push({
        name: this.firstTier,
        label: this.firstTier + ' / ' + this.secondTier,
        field: (item) => item[item.length - 1],
        align: 'center'
      })
      columnsValue.forEach((field, index) => columns.push({
        name: field,
        label: field,
        sortable: true,
        field: (item) => item[index] // note: 如果 dataset 是物件，這邊可以直接放 key，就會找到對應的 value，就不用為了轉成 array 又要對齊 column 的位置。但是這樣 datasetForTable 會不知道怎麼做。
      }))
      return columns
    }
  },
  watch: {
    type (value) {
      this.isFlipped
        ? this.firstTier = value
        : this.secondTier = value
    }
  },
  mixins: [mixin],
  methods: {
    uploadFile (file, updateProgress) {
      Loading.show()
      return new Promise((resolve, reject) => {
        resolve(file)
      })
    },
    uploaded (file) {
      const reader = new FileReader()

      reader.onload = (evt) => {
        this.inputData = evt.target.result

        this.isTypeSelectDisabled = false
        this.isGranularitySelectDisabled = false
        this.isFlipDisabled = false
        Loading.hide()
      }
      reader.readAsText(file)
    },
    /**
     * 描述
     * @param {string} data - The input csv data.
     * @returns {array}
     */
    parseData (data) {
      const times = {}
      const users = {}
      const nations = {}
      const otts = {}

      const splitData = data.split(/\n/)
      const parsedData = []
      for (const item of splitData) {
        if (item === '') continue

        let arr = item.split(',')
          .map((value) => value.trim())

        // 處理 OTT 含有 comma 的情況，因為會被 split，要把他 concat 回來
        // 不過目前用 hard code 的方法處理，之後可以想辦法寫的更漂亮一點
        let result = arr.length === 6
          ? arr
          : arr.slice(0, 3).concat([arr[3] + ', ' + arr[4]]).concat(arr.slice(5))

        const time = result[0]
        times[time] = result[0]
        const user = result[1]
        users[user] = user
        const nation = result[3]
        nations[nation] = nation
        const ott = result[4]
        otts[ott] = ott
        parsedData.push(result)
      }

      for (const prop in times) {
        this.allTimes.push(prop)
      }

      for (const prop in users) {
        this.users.push(prop)
      }

      for (const prop in nations) {
        this.nations.push(prop)
      }

      for (const prop in otts) {
        this.otts.push(prop)
      }

      return parsedData
    },
    /**
     * 描述
     * @param {array} data - The data that has been transferred, aggregated, granulated.
     * @returns {array}
     */
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
    handleFlip () {
      this.isFlipped = !this.isFlipped
      const temp = this.firstTier
      this.firstTier = this.secondTier
      this.secondTier = temp
    }
  }
}
</script>
