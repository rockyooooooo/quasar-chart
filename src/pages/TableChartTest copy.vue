<template>
  <div style="min-width: 500px; width: 800px; max-width: 90vw;">
    <p class="caption">
      Single File Upload
    </p>
    <q-uploader
      :multiple="false"
      :url="''"
      :upload-factory="uploadFile"
      @uploaded="uploaded"
    />
    <p class="caption">
      Type
    </p>
    <q-select
      v-model="type"
      :options="typeOptions"
      :disable="isTypeSelectDisabled"
      @input="typeOnChange"
    />
    <p class="caption">
      Granularity
    </p>
    <q-select
      v-model="granularity"
      :options="granularityOptions"
      :disable="isGranularitySelectDisabled"
      @input="granularityOnChange"
    />
    <q-table
      title="Table Title"
      :data="dataForTable"
      :columns="columns"
      row-key="name"
    />
    <q-btn
      @click="handleFlip"
      :disable="isFlipDiabled"
    >
      Flip
    </q-btn>
  </div>
</template>

<script>
import { mixin } from './mixin'

export default {
  name: 'TableChart',
  data () {
    return {
      parsedData: [],
      firstTier: 'times',
      secondTier: '',
      type: '',
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
      times: [],
      users: [],
      nations: [],
      otts: [],
      transferredData: [],
      secondTransferredData: [],
      granulatedData: [],
      aggregatedData: [],
      dataForTable: [],
      columns: [],
      isFlipDiabled: true,
      isFlipped: false
    }
  },
  computed: {},
  watch: {},
  mixins: [mixin],
  methods: {
    uploadFile (file, updateProgress) {
      return new Promise((resolve, reject) => {
        resolve(file)
      })
    },
    uploaded (file) {
      const reader = new FileReader()

      reader.onload = (evt) => {
        const inputData = evt.target.result
        const parsedData = this.parseData(inputData)
        this.parsedData = parsedData
        console.log('parsedData: ', parsedData)

        const transferredData = this.transfer(parsedData, this.firstTier)
        this.transferredData = transferredData
        console.log('transferredData: ', transferredData)

        this.isTypeSelectDisabled = false
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
            if (index === 3) nations[field] = true
            if (index === 4) otts[field] = true
          })

          return result
        })

      for (const prop in times) {
        this.allTimes.push(prop)
      }
      this.times = this.granulateTimes(this.allTimes, this.granularity)

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
    typeOnChange (type) {
      console.log('type: ', type)
      this.isFlipped
        ? this.firstTier = type
        : this.secondTier = type
      console.log('first tier: ', this.firstTier)
      console.log('second tier: ', this.secondTier)

      const transferredData = this.transfer(this.parsedData, this.firstTier)
      this.transferredData = transferredData
      console.log('transferredData: ', transferredData)

      const secondTransferredData = {}
      for (const key in transferredData) {
        secondTransferredData[key] = this.transfer(transferredData[key], this.secondTier)
      }
      this.secondTransferredData = secondTransferredData
      console.log('secondTransferredData: ', secondTransferredData)

      if (this.firstTier === 'times') {
        // times 在 first tier，在 second transfer 後 granulate
        const granulatedData = this.granulateTransferredData(secondTransferredData, this.granularity)
        const aggregatedData = this.aggregate(granulatedData)
        const dataForTable = this.transferForTable(aggregatedData)
        this.granulatedData = granulatedData
        this.aggregatedData = aggregatedData
        this.dataForTable = dataForTable

        console.log('granulatedData: ', granulatedData)
        console.log('aggregatedData: ', aggregatedData)
        console.log('dataForTable: ', dataForTable)
      }
      if (this.secondTier === 'times') {
        // times 在 second tier，在 aggregate 後做 granulate
        const aggregatedData = this.aggregate(secondTransferredData)
        const granulatedData = this.granulateAggregatedData(aggregatedData, this.granularity)
        const dataForTable = this.transferForTable(granulatedData)
        this.aggregatedData = aggregatedData
        this.granulatedData = granulatedData
        this.dataForTable = dataForTable

        console.log('aggregatedData: ', aggregatedData)
        console.log('granulatedData: ', granulatedData)
        console.log('dataForTable: ', dataForTable)
      }

      this.generateColumns()
      this.isGranularitySelectDisabled = false
      this.isFlipDiabled = false
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
    generateColumns () {
      const columnsValue = this[this.secondTier]

      this.columns = []
      this.columns.push({
        name: this.firstTier,
        label: this.firstTier + ' / ' + this.secondTier,
        field: (item) => item[item.length - 1],
        align: 'center'
      })
      columnsValue.forEach((field, index) => this.columns.push({
        name: field,
        label: field,
        sortable: true,
        field: (item) => item[index] // note: 如果 dataset 是物件，這邊可以直接放 key，就會找到對應的 value，就不用為了轉成 array 又要對齊 column 的位置。但是這樣 datasetForTable 會不知道怎麼做。
      }))
    },
    granularityOnChange (granularity) {
      console.log('granularity: ', granularity)
      this.times = this.granulateTimes(this.allTimes, granularity)

      const transferredData = this.transfer(this.parsedData, this.firstTier)
      this.transferredData = transferredData
      console.log('transferredData: ', transferredData)

      const secondTransferredData = {}
      for (const key in transferredData) {
        secondTransferredData[key] = this.transfer(transferredData[key], this.secondTier)
      }
      this.secondTransferredData = secondTransferredData
      console.log('secondTransferredData: ', secondTransferredData)

      if (this.firstTier === 'times') {
        // times 在 first tier，在 second transfer 後 granulate
        const granulatedData = this.granulateTransferredData(secondTransferredData, this.granularity)
        const aggregatedData = this.aggregate(granulatedData)
        const dataForTable = this.transferForTable(aggregatedData)
        this.granulatedData = granulatedData
        this.aggregatedData = aggregatedData
        this.dataForTable = dataForTable

        console.log('granulatedData: ', granulatedData)
        console.log('aggregatedData: ', aggregatedData)
        console.log('dataForTable: ', dataForTable)
      }
      if (this.secondTier === 'times') {
        // times 在 second tier，在 aggregate 後做 granulate
        const aggregatedData = this.aggregate(secondTransferredData)
        const granulatedData = this.granulateAggregatedData(aggregatedData, this.granularity)
        const dataForTable = this.transferForTable(granulatedData)
        this.aggregatedData = aggregatedData
        this.granulatedData = granulatedData
        this.dataForTable = dataForTable

        console.log('aggregatedData: ', aggregatedData)
        console.log('granulatedData: ', granulatedData)
        console.log('dataForTable: ', dataForTable)
      }

      this.generateColumns()
    },
    handleFlip () {
      console.log('======================Flip!======================')
      this.isFlipped = !this.isFlipped
      ;[this.firstTier, this.secondTier] = [this.secondTier, this.firstTier]
      console.log('first tier: ', this.firstTier)
      console.log('second tier: ', this.secondTier)

      const transferredData = this.transfer(this.parsedData, this.firstTier)
      this.transferredData = transferredData
      console.log('transferredData: ', transferredData)

      const secondTransferredData = {}
      for (const key in transferredData) {
        secondTransferredData[key] = this.transfer(transferredData[key], this.secondTier)
      }
      this.secondTransferredData = secondTransferredData
      console.log('secondTransferredData: ', secondTransferredData)

      if (this.firstTier === 'times') {
        // times 在 first tier，在 second transfer 後 granulate
        const granulatedData = this.granulateTransferredData(secondTransferredData, this.granularity)
        const aggregatedData = this.aggregate(granulatedData)
        const dataForTable = this.transferForTable(aggregatedData)
        this.granulatedData = granulatedData
        this.aggregatedData = aggregatedData
        this.dataForTable = dataForTable

        console.log('granulatedData: ', granulatedData)
        console.log('aggregatedData: ', aggregatedData)
        console.log('dataForTable: ', dataForTable)
      }
      if (this.secondTier === 'times') {
        // times 在 second tier，在 aggregate 後做 granulate
        const aggregatedData = this.aggregate(secondTransferredData)
        const granulatedData = this.granulateAggregatedData(aggregatedData, this.granularity)
        const dataForTable = this.transferForTable(granulatedData)
        this.aggregatedData = aggregatedData
        this.granulatedData = granulatedData
        this.dataForTable = dataForTable

        console.log('aggregatedData: ', aggregatedData)
        console.log('granulatedData: ', granulatedData)
        console.log('dataForTable: ', dataForTable)
      }

      this.generateColumns()
      console.log('======================Flip!======================')
    }
  }
}
</script>
