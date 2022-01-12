<template>
  <div style="width: 500px; max-width: 90vw;">
    <p class="caption">Single File Upload</p>
    <q-uploader
      :multiple="false"
      :url="''"
      :upload-factory="uploadFile"
      @uploaded="uploaded"
    />
    <q-table
      title="Table Title"
      :data="dataset"
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
      columns: [
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
          field: (item) => item[5],
          sortable: true
        }
      ],
      dataset: [],
      hasFlipped: false
    }
  },
  methods: {
    uploadFile (file, updateProgress) {
      this.dataset = []
      this.hasFlipped = false
      document.querySelector('tbody').innerHTML = ''

      return new Promise((resolve, reject) => {
        resolve(file)
      })
    },
    uploaded (file) {
      const reader = new FileReader()

      reader.onload = (evt) => {
        console.time('upload')

        const inputData = evt.target.result
        const processedData = this.processData(inputData)
        this.dataset = processedData

        console.timeEnd('upload')
      }
      reader.readAsText(file)
    },
    processData (data) {
      return data.split(/\n/)
        .filter((item) => item !== '')
        .map((item) => {
          return item.split(',').map((value) => {
            return value.trim()
          })
        })
    },
    flipTable () {
      // ===================用 CSS 來翻===================
      document.querySelector('.q-table-container').classList.toggle('flipped')
      // =======================End=======================

      // ================改變 dataset 的排列================
      // q1. 翻頁功能會變成翻 head，不是真的翻資料
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
