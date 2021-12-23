<template>
  <div style="width: 500px; max-width: 90vw;">
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
      :options="users"
      :disable="isUserSelectDisabled"
      @input="userOnChange"
    />
    <p class="caption">Start date</p>
    <q-datetime
      v-model="startDate"
      type="date"
      :default-value="defaulteStartDate"
      :disable="isStartDateSelectDisabled"
      :min="minStartDate"
      :max="maxStartDate"
      @change="startDateOnChange"
    />
    <p class="caption">Comparison date</p>
    <q-select
      v-model="comparisonDate"
      :options="comparisonDates"
      :disable="isComparisonDateSelectDisabled"
      @input="comparisonDateOnChange"
    />
    <!-- <q-datetime
      v-model="comparisonDate"
      type="date"
      :disable="isComparisonDateSelectDisabled"
      :min="minComparisonDate"
      :max="maxComparisonDate"
      @change="comparisonDateOnChange"
    /> -->
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

const weekDays = 7

export default {
  name: 'Form',
  data () {
    return {
      users: [],
      dataset: [],
      user: '',
      userBpsPerDate: [],
      defaulteStartDate: '',
      minStartDate: '',
      maxStartDate: '',
      startDate: '',
      baseDates: [],
      comparisonDate: '',
      comparisonDates: [],
      isUserSelectDisabled: true,
      isStartDateSelectDisabled: true,
      isComparisonDateSelectDisabled: true
    }
  },
  methods: {
    resetData () {
      d3.select('.chart').selectAll('*').remove()
      this.users = []
      this.dataset = []
      this.user = ''
      this.userBpsPerDate = []
      this.minStartDate = ''
      this.maxStartDate = ''
      this.startDate = ''
      this.baseDates = []
      this.comparisonDate = ''
      this.comparisonDates = []
      this.isUserSelectDisabled = true
      this.isStartDateSelectDisabled = true
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

        const users = {}
        const data = inputData.split(/\n/)

        const values = data.filter((item) => item !== '')
          .map((item) => item.split(',').map((value, index) => {
            const trimedValue = value.trim()
            if (index === 1) users[trimedValue] = true
            return trimedValue
          }))

        for (const prop in users) {
          this.users.push({ label: prop, value: prop })
        }

        this.dataset = values
        this.isUserSelectDisabled = false
        console.timeEnd('upload')
      }
      reader.readAsText(file)
    },
    userOnChange (user) {
      d3.select('.chart').selectAll('*').remove()
      this.userBpsPerDate = []
      this.minStartDate = ''
      this.maxStartDate = ''
      this.startDate = ''
      this.comparisonDate = ''
      this.isStartDateSelectDisabled = true

      const userData = this.dataset.filter((item) => item[1] === user)
      const result = this.accumulateBpsPerDate(userData)
      this.userBpsPerDate = result

      const dates = result.map((item) => item[0])
      this.defaulteStartDate = dates[0]
      this.minStartDate = dates[0]
      this.maxStartDate = dates[dates.length - 1]
      this.isStartDateSelectDisabled = false
    },
    accumulateBpsPerDate (data) {
      const dateBps = {}
      data
        .filter((item) => item !== '')
        .forEach((item) => { // 可以試試看用 reduce
          const date = item[0].slice(0, 10)
          if (!dateBps[date]) {
            dateBps[date] = Number(item[5]) || 0 // todo: improve hardcoding
          } else {
            dateBps[date] += Number(item[5]) || 0 // todo: improve hardcoding
          }
        })
      return Object.entries(dateBps)
    },
    startDateOnChange (value) {
      d3.select('.chart').selectAll('*').remove()

      const date = value.slice(0, 10)
      const startIndex = this.userBpsPerDate.findIndex((item) => item[0] === date)
      const selectedDates = this.userBpsPerDate.slice(startIndex, startIndex + weekDays)
      this.baseDates = selectedDates

      const validComparisonDates = []
      for (let i = startIndex - weekDays; i + weekDays > 0; i -= weekDays) {
        const endIndex = i + weekDays - 1
        if (i < 0) i = 0
        validComparisonDates.push({
          label: `${this.userBpsPerDate[i][0]} ~ ${this.userBpsPerDate[endIndex][0]}`,
          value: [this.userBpsPerDate[i][0], endIndex - i]
        })
      }
      this.comparisonDates = validComparisonDates

      this.isComparisonDateSelectDisabled = false
    },
    comparisonDateOnChange (value) {
      const date = value[0]
      const offset = value[1] + 1
      const startIndex = this.userBpsPerDate.findIndex((item) => item[0] === date)
      const selectedDates = this.userBpsPerDate.slice(startIndex, startIndex + offset)
      this.renderBarChart(this.baseDates.slice(0, weekDays), selectedDates)
    },
    renderBarChart (baseDates, comparisonDates) {
      d3.select('.chart').selectAll('*').remove()

      const chartWidth = 500
      const chartHeight = 500
      const barWidth = 30
      const keys = baseDates.map((item) => item[0])
      const bpsArr = baseDates.map((item) => item[1])
      const comparisonKeys = comparisonDates.map((item) => item[0])
      const comparisonBpsArr = comparisonDates.map((item) => item[1])
      const allData = bpsArr.concat(comparisonBpsArr)

      const min = d3.min(allData) * 0.95
      const max = d3.max(allData) * 1.05

      const paddedKeys = keys.slice()
      for (let i = keys.length; paddedKeys.length < weekDays; i++) {
        paddedKeys.push(`null${i}`)
        bpsArr.push(min)
      }

      const paddedComparisonKeys = comparisonKeys.slice()
      for (let i = comparisonKeys.length; paddedComparisonKeys.length < weekDays; i++) {
        paddedComparisonKeys.unshift(`null${i}`)
        comparisonBpsArr.unshift(min)
      }

      // const allKeys = []
      // for (let i = 0; i < weekDays; i++) {
      //   allKeys.push([keys[i], paddedComparisonKeys[i]])
      // }

      const xLinear = d3.scaleBand()
        .domain(paddedKeys)
        .range([0, chartWidth])

      const comparisonXLinear = d3.scaleBand()
        .domain(paddedComparisonKeys)
        .range([0, chartWidth])

      const yLinear = d3.scaleLinear()
        .domain([min, max])
        .range([0, chartHeight])

      const reverseYLinear = d3.scaleLinear()
        .domain([max, min])
        .range([0, chartHeight])

      const reverseLineYLinear = d3.scaleLinear()
        .domain([max, min])
        .range([0, chartHeight])

      const chart = d3.select('.chart')
        .attr('width', chartWidth)
        .attr('height', chartHeight)

      const bars = chart.selectAll('g')
        .data(bpsArr)
        .enter()
        .append('g')

      const interval = ((chartWidth - (bpsArr.length * barWidth)) / (bpsArr.length))
      bars.append('rect')
        .attr('x', (d, i) => i * (barWidth + interval) + (interval / 2))
        .attr('y', (d) => chartHeight - yLinear(d))
        .attr('width', barWidth)
        .attr('height', (d) => yLinear(d))
        .attr('fill', '#5F4B8B')

      // bars.append('text')
      //   .attr('y', (d) => chartHeight - yLinear(d) - 6)
      //   .attr('x', (d, i) => i * (barWidth + interval) + (interval / 2) + (barWidth / 2))
      //   .style('fill', '#000')
      //   .style('font-size', '12px')
      //   .style('font-weight', 'bold')
      //   .style('text-anchor', 'middle')
      //   .text((d) => d)

      const xAxis = d3.axisBottom(xLinear)
      const comparisonXAxis = d3.axisTop(comparisonXLinear)
      const yAxis = d3.axisLeft(reverseYLinear)
        .tickFormat((d) => {
          let remainder = d
          let counter = 0
          while (remainder > 1000) {
            remainder /= 1000
            counter++
          }
          const units = ['', 'k', 'm', 'b']
          return remainder + units[counter]
        })

      chart.append('g')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(xAxis)
      chart.append('g').call(comparisonXAxis)
      chart.append('g').call(yAxis)

      chart.append('path')
        .datum(comparisonBpsArr)
        .attr('fill', 'none')
        .attr('stroke', '#FEDE00')
        .attr('stroke-width', 2)
        .attr('d', d3.line()
          .x((d, i) => i * (barWidth + interval) + (interval / 2) + (barWidth / 2))
          .y((d) => reverseLineYLinear(d))
        )
    }
  }
}
</script>
