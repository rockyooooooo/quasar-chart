<template>
  <div style="width: 500px; max-width: 90vw;">
    <p class="caption">Single File Upload</p>
    <q-uploader
      :multiple="false"
      :url="''"
      :upload-factory="uploadFile"
      @uploaded="uploaded"
    />
    <p class="caption">Type</p>
    <q-select
      v-model="type"
      :options="types"
      :disable="isTypeSelectDisabled"
      @input="typeOnChange"
    />
    <q-table
      title="Table Title"
      :data="datasetForTable"
      :columns="columns"
      row-key="name"
    />
    <q-btn @click="handleFlip" :disable="isFlipDiabled">Flip</q-btn>
  </div>
</template>

<style>
.q-table-container {
  margin: 2rem 0;
}

.flipped table {
  display: flex;
}

.flipped table th,
.flipped table td {
  text-align: center;
}

.flipped table thead {
  border: none;
}

.flipped table > thead > tr {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.flipped table > thead > tr > th {
  height: 100%;
  width: 100%;
}

.flipped table > thead > tr{
  border-right: solid 1px rgba(0, 0, 0, 0.12);
}

.flipped table > tbody {
  display: flex;
}

.flipped table > tbody > tr {
  display: flex;
  flex-direction: column;
}

.flipped table > tbody > tr > td {
  border-bottom: none;
}

.flipped table > tbody > tr + tr {
  border-left: solid 1px rgba(0, 0, 0, 0.12);
}
</style>

<script>
export default {
  name: 'TableChart',
  data () {
    return {
      columns: [],
      dataset: [],
      datasetForTable: [],
      type: '',
      types: [
        { label: 'User', value: 'users' },
        { label: 'Nation', value: 'nations' },
        { label: 'OTT Service', value: 'otts' }
      ],
      times: [],
      users: [],
      ips: [],
      nations: [],
      otts: [],
      isTypeSelectDisabled: true,
      firstColumnType: 'times',
      columnsType: '',
      hasFlipped: false,
      isFlipDiabled: true
    }
  },
  methods: {
    uploadFile (file, updateProgress) {
      this.reset()
      // this.hasFlipped = false
      document.querySelector('tbody').innerHTML = ''

      return new Promise((resolve, reject) => {
        resolve(file)
      })
    },
    uploaded (file) {
      const reader = new FileReader()

      reader.onload = (evt) => {
        const inputData = evt.target.result
        console.time('process data')
        const processedData = this.processData(inputData)
        console.timeEnd('process data')

        this.dataset = processedData
        this.datasetForTable = processedData
        this.isTypeSelectDisabled = false
      }
      reader.readAsText(file)
    },
    reset () {
      this.columns = [
        {
          name: 'time',
          label: 'Time',
          field: (item) => item[0]
        },
        {
          name: 'user',
          label: 'user',
          field: (item) => item[1]
        },
        {
          name: 'topIP',
          label: 'Top IP',
          field: (item) => item[2]
        },
        {
          name: 'nation',
          label: '國別',
          field: (item) => item[3]
        },
        {
          name: 'OTTService',
          label: 'OTT Service',
          field: (item) => item[4]
        },
        {
          name: 'bps',
          label: 'bps',
          field: (item) => item[5]
        }
      ]
      this.dataset = []
      this.datasetForTable = []
      this.type = ''
      this.times = []
      this.users = []
      this.ips = []
      this.nations = []
      this.otts = []
      this.isFlipDiabled = true
    },
    processData (data) {
      const times = {}
      const users = {}
      const nations = {}
      const otts = {}

      const processedData = data.split(/\n/)
        .filter((item) => item !== '')
        .map((item) => {
          let arr = item.split(',')
            .map((value) => value.trim())

          // 處理 OTT 含有 comma 的情況，因為會被 split，要把他 concat 回來
          // 不過目前用 hard code 的方法處理，之後可以想辦法寫的更漂亮一點
          let result = arr.length === 6
            ? arr
            : arr.slice(0, 3).concat([arr[3] + ', ' + arr[4]]).concat(arr.slice(5))

          // 出現過的 time, user, nation, ott 用 object 存，讓他不會重複
          result.forEach((field, index) => {
            if (index === 0) times[field] = true
            if (index === 1) users[field] = true
            if (index === 3) nations[field] = true
            if (index === 4) otts[field] = true
          })

          return result
        })

      // 把 times, user, nation, ott 用 array 存成一個清單
      for (const prop in times) {
        this.times.push(prop)
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

      return processedData
    },
    typeOnChange () {
      this.isFlipDiabled = false

      this.generateColumns()
      const aggregatedData = this.aggregate(this.dataset, this.type)
      const transferedData = this.transfer(aggregatedData, this.type)
      this.datasetForTable = transferedData

      if (this.hasFlipped) this.flipTable()
    },
    generateColumns () {
      this.columnsType = this.hasFlipped ? 'times' : this.type
      this.firstColumnType = this.hasFlipped ? this.type : 'times'
      const columnsValue = this[this.columnsType]

      this.columns = []
      this.columns.push({
        name: this.firstColumnType,
        label: this.firstColumnType + ' / ' + this.columnsType,
        field: (item) => item[item.length - 1],
        align: 'center'
      })
      columnsValue.forEach((field, index) => this.columns.push({
        name: field,
        label: field,
        field: (item) => item[index] // note: 如果 dataset 是物件，這邊可以直接放 key，就會找到對應的 value，就不用為了轉成 array 又要對齊 column 的位置
      }))
    },
    aggregate (processedData, type) {
      let aggregatedData = {}
      let targetTypeIndex = 0
      switch (type) {
        case 'users':
          targetTypeIndex = 1
          break
        case 'nations':
          targetTypeIndex = 3
          break
        case 'otts':
          targetTypeIndex = 4
          break
      }

      processedData.forEach((item) => {
        // 找出 time，沒有就 push 新增一個，已經有存了就直接放進去原本的
        if (aggregatedData[item[0]]) {
          // 根據下拉選單選定的 type 找到該欄位，找不到就 push 新增一個，已經有存了就直接跟原本的加起來
          if (aggregatedData[item[0]][item[targetTypeIndex]]) {
            aggregatedData[item[0]][item[targetTypeIndex]] += Number(item[5])
          } else {
            aggregatedData[item[0]][item[targetTypeIndex]] = Number(item[5])
          }
        } else {
          aggregatedData[item[0]] = { [item[targetTypeIndex]]: Number(item[5]) }
        }
      })
      return aggregatedData
    },
    transfer (aggregatedData, type) {
      return Object.entries(aggregatedData).map((row) => {
        // 建立一個只放 bps 的 array
        const newRow = Array(this[type].length).fill(0)
        for (const field in row[1]) {
          const fieldIndex = this[type].indexOf(field)
          newRow[fieldIndex] += row[1][field]
        }
        // 最後把 X 軸的 label 放進去做二維 table
        newRow.push(row[0])
        return newRow
      })
    },
    handleFlip () {
      this.hasFlipped = !this.hasFlipped
      this.flipTable()
    },
    flipTable () {
      this.generateColumns()
      const flippedArray = this.flipArray(this.datasetForTable)
      while (flippedArray.length > this[this.firstColumnType].length) {
        flippedArray.pop()
      }
      flippedArray.forEach((row, index) => row.push(this[this.firstColumnType][index]))
      this.datasetForTable = flippedArray
    },
    flipArray (arr) {
      const flippedArr = []
      for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[i].length; j++) {
          if (!flippedArr[j]) flippedArr.push([])
          if (!flippedArr[j][i]) flippedArr[j].push([])
          flippedArr[j][i] = arr[i][j]
        }
      }
      return flippedArr
    }
  }
}
</script>
