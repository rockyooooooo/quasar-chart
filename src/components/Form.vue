<template>
  <div style="width: 500px; max-width: 90vw;">
    <p class="caption">Single File Upload</p>
    <q-uploader :url="url" :upload-factory="uploadFile" @uploaded="uploaded" />
    <p class="caption">User</p>
    <q-select
      v-model="user"
      :options="users"
      :disable="isUserSelectDisabled"
      @input="userOnChange"
    />
    <p class="caption">Current date</p>
    <q-datetime
      v-model="startDate"
      type="date"
      :disable="isCurrentDateSelectDisabled"
      :min="minDate"
      :max="maxDate"
      @change="currentDateOnChange"
    />
    <p class="caption">Comparison date</p>
    <q-datetime
      v-model="endDate"
      type="date"
      :disable="isComparisonDateSelectDisabled"
    />
    <!-- <Chart :dataset="dataset" /> -->
    <svg class="chart"></svg>
  </div>
</template>

<style>
.chart {
  overflow: visible !important;
  margin-top: 2rem;
}
</style>

<script>
// import Chart from './Chart.vue'
import * as d3 from 'd3'

export default {
  name: 'Form',
  data () {
    return {
      url: '',
      users: [],
      user: '',
      userBpsPerDate: [],
      minDate: '',
      maxDate: '',
      startDate: null,
      isUserSelectDisabled: true,
      isCurrentDateSelectDisabled: true,
      isComparisonDateSelectDisabled: true,
      // 底下還沒用到，分隔一下
      endDate: null,
      dataset: [],
      dates: {},
      targetDate: {}
    }
  },
  methods: {
    resetData () {
      this.users = []
      this.user = ''
      this.userBpsPerDate = []
      this.minDate = ''
      this.maxDate = ''
      this.startDate = ''
      this.isUserSelectDisabled = true
      this.isCurrentDateSelectDisabled = true
      this.isComparisonDateSelectDisabled = true
    },
    uploadFile (file, updateProgress) {
      return new Promise((resolve, reject) => {
        resolve(file)
      })
    },
    uploaded (file) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        console.time('upload')
        this.resetData()

        const inputData = evt.target.result

        // ==========================second solution(須解決換行字元問題)===========================
        // let str = ''
        // const keys = []
        // const obj = {}
        // const result = []
        // let isHeaderSet = false
        // let valueOffset = 0
        // for (let i = 0; i < inputData.length; i++) {
        //   if (/\n/.test(inputData[i])) {
        //     if (!isHeaderSet) {
        //       isHeaderSet = true
        //       for (const key of keys) {
        //         obj[key] = null
        //       }
        //     } else {
        //       result.push(obj)
        //     }
        //   }
        //   if (inputData[i] === ',') {
        //     if (!isHeaderSet) {
        //       keys.push = str.trim()
        //       str = ''
        //     } else {
        //       obj[keys[valueOffset]] = str.trim()
        //       str = ''
        //     }
        //   }
        //   str += inputData[i]
        // }
        // ====================================================================

        // ===========================first solution===========================
        // const users = {}
        // const dates = {}

        // const data = inputData.split(/\n/)
        // const keys = data[0].split(',').map((item) => item.trim())
        // const values = data.slice(1)
        //   .filter((item) => item !== '')
        //   .map((item) => {
        //     const obj = {}
        //     item.split(',').map((value, index) => {
        //       obj[keys[index]] = value.trim()
        //       return value.trim()
        //     })

        //     if (!users[obj.user]) users[obj.user] = true

        //     const date = obj.Time.slice(0, 10)
        //     if (!dates[date]) {
        //       dates[date] = Number(obj.bps) || 0
        //     } else {
        //       dates[date] += Number(obj.bps) || 0
        //     }

        //     return obj
        //   })

        // for (const prop in users) {
        //   this.users.push({ label: prop, value: prop })
        // }

        // this.dates = dates
        // this.minDate = d3.min(Object.keys(dates))
        // this.maxDate = d3.max(Object.keys(dates))
        // ====================================================================

        // =========================first solution ver2========================
        const users = {}
        const data = inputData.split(/\n/)
        const values = data.slice(1)
          .filter((item) => item !== '')
          .map((item) => item.split(',').map((value, index) => {
            const trimedValue = value.trim()
            if (index === 1) users[trimedValue] = true
            return trimedValue
          }))

        for (const prop in users) {
          this.users.push({ label: prop, value: prop })
        }
        // ====================================================================

        console.timeEnd('upload')

        this.dataset = values

        this.isUserSelectDisabled = false
        // this.isComparisonDateSelectDisabled = false

        // this.render(dates)
      }
      reader.readAsText(file)
    },
    userOnChange (user) {
      d3.select('.chart').selectAll('*').remove()
      this.userBpsPerDate = []
      this.minDate = ''
      this.maxDate = ''
      this.startDate = ''
      this.isCurrentDateSelectDisabled = true

      const userData = this.dataset.filter((item) => item[1] === user)
      const result = this.accumulateBpsPerDate(userData)
      this.userBpsPerDate = result

      const dates = result.map((item) => item[0])
      this.minDate = d3.min(dates)
      this.maxDate = d3.max(dates)
      this.isCurrentDateSelectDisabled = false
    },
    accumulateBpsPerDate (data) {
      const dateBps = {}
      data
        .filter((item) => item !== '')
        .forEach((item) => { // 可以改用 reduce
          const date = item[0].slice(0, 10)
          if (!dateBps[date]) {
            dateBps[date] = Number(item[5]) || 0
          } else {
            dateBps[date] += Number(item[5]) || 0
          }
        })
      return Object.entries(dateBps)
    },
    currentDateOnChange (value) {
      const date = value.slice(0, 10)
      const startIndex = this.userBpsPerDate.findIndex((item) => item[0] === date)
      const selectedDates = this.userBpsPerDate.slice(startIndex, startIndex + 7)
      this.render(selectedDates)
    },
    render (dates) {
      d3.select('.chart').selectAll('*').remove()

      const chartWidth = 500
      const chartHeight = 500
      const barWidth = 35
      const keys = dates.map((item) => item[0])
      const bpsArr = dates.map((item) => item[1])

      const min = d3.min(bpsArr)
      const max = d3.max(bpsArr)

      const xlinear = d3.scaleBand()
        .domain(keys)
        .range([0, chartWidth])

      const yLinear = d3.scaleLinear()
        .domain([min, max])
        .range([50, chartHeight])

      const reverseYLinear = d3.scaleLinear()
        .domain([max, min])
        .range([0, chartHeight])

      const chart = d3.select('.chart')
        .attr('width', chartWidth)
        .attr('height', chartHeight)

      const bar = chart.selectAll('g')
        .data(bpsArr)
        .enter()
        .append('g')

      const interval = ((chartWidth - (bpsArr.length * barWidth)) / (bpsArr.length))
      bar.append('rect')
        .attr('x', (d, i) => i * (barWidth + interval) + interval / 2)
        .attr('y', (d) => chartHeight - yLinear(d))
        .attr('width', barWidth)
        .attr('height', (d) => yLinear(d))
        .attr('fill', '#5F4B8B')

      bar.append('text')
        .attr('y', (d) => chartHeight - yLinear(d) + 20)
        .attr('x', (d, i) => i * (barWidth + interval) + interval / 2)
        .style('fill', '#000')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .style('text-anchor', 'middle')
        .text((d) => d)

      const xAxis = d3.axisBottom(xlinear)
      const yAxis = d3.axisLeft(reverseYLinear)

      chart.append('g').attr('transform', `translate(0, ${chartHeight})`).call(xAxis)
      chart.append('g').call(yAxis)
    }
  }
}
</script>
