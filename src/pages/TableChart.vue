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
    <q-btn @click="flipTable">Flip</q-btn>
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
      isTypeSelectDisabled: true
      // hasFlipped: false
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
        console.time('upload')
        const processedData = this.processData(inputData)
        console.timeEnd('upload')

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
      this.times = []
      this.users = []
      this.ips = []
      this.nations = []
      this.otts = []
    },
    processData (data) {
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

          // 出現過的 user, nation, ott 用 object 存，讓他不會重複
          result.forEach((field, index) => {
            if (index === 1) users[field] = true
            if (index === 3) nations[field] = true
            if (index === 4) otts[field] = true
          })

          return result
        })

      // 把 user, nation, ott 存成一個清單
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
      this.generateColumns()
      console.time('aggregate')
      const aggregatedData = this.aggregate(this.dataset, this.type)
      console.timeEnd('aggregate')
      console.time('transfer')
      const transferedData = this.transfer(aggregatedData, this.type)
      console.timeEnd('transfer')

      this.datasetForTable = transferedData
    },
    generateColumns () {
      this.columns = []
      this.columns.push({ name: 'date', label: 'Time', field: (item) => item[item.length - 1] })
      this[this.type].forEach((type, index) => this.columns.push({
        name: type,
        label: type,
        field: (item) => item[index]
      }))
    },
    aggregate (data, type) {
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

      data.forEach((item) => {
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
    transfer (data, type) {
      return Object.entries(data).map((row) => {
        const newRow = Array(this[type].length).fill(0)
        for (const field in row[1]) {
          const fieldIndex = this[type].indexOf(field)
          newRow[fieldIndex] += row[1][field]
        }
        newRow.push(row[0])
        return newRow
      })
    },
    flipTable () {
      // =============改變 dataset 的排列 part.2============
      // 1. 把 columns 換成 times
      const arr = this.datasetForTable.map((item) => item.pop())
      console.log(arr, this.datasetForTable)
      // 2. 把 times 換成 columns
      // 3. flipArray()
      // =======================End=======================

      // ===================用 CSS 來翻===================
      // document.querySelector('.q-table-container').classList.toggle('flipped')
      // =======================End=======================

      // ================改變 dataset 的排列================
      // q1. 翻頁功能會變成翻 head，沒有翻資料
      // const flippedDataset = this.flipArray(this.dataset)
      // this.dataset = flippedDataset
      // =======================End=======================

      // ===================直接操作 DOM===================
      // q1. thead 的部分要再想辦法調整（th 有留住，但是 thead 不知道怎麼留）
      // q2. 新上傳檔案的時候要把 table 清掉
      // const tbody = document.querySelector('tbody')
      // const trs = [...tbody.children]
      // const tableArr = trs.map((item) => [...item.children])

      // let flippedFullArr = []
      // if (!this.hasFlipped) {
      //   const ths = [...document.querySelectorAll('th')]
      //   const fullArr = [ths, ...tableArr]
      //   flippedFullArr = this.flipArray(fullArr)
      // } else {
      //   flippedFullArr = this.flipArray(tableArr)
      // }

      // tbody.innerHTML = ''
      // for (let i = 0; i < flippedFullArr.length; i++) {
      //   const tr = document.createElement('tr')
      //   for (let j = 0; j < flippedFullArr[i].length; j++) {
      //     tr.append(flippedFullArr[i][j])
      //   }
      //   tbody.append(tr)
      // }

      // document.querySelector('thead').innerHTML = ''
      // this.hasFlipped = true
      // =======================End=======================
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
