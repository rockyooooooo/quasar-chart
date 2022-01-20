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
      :options="userOptions"
      :disable="isUserSelectDisabled"
      @input="userOnChange"
    />
    <p class="caption">Granularity</p>
    <q-select
      v-model="granularity"
      :options="granularities"
      :disable="isGranularitySelectDisabled"
      @input="granularityOnChange"
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
    <div class="chart-container">
      <svg class="chart"></svg>
    </div>
  </div>
</template>

<style>
.chart {
  overflow: visible !important;
  margin-top: 2rem;
}
</style>

<script>
import * as d3 from 'd3'

const weekDays = 7

export default {
  name: 'BarChart',
  data () {
    return {
      users: [],
      userOptions: [],
      allTimes: [],
      times: [],
      dataset: [],
      aggregatedData: {},
      user: '',
      granularity: 60 * 3,
      granularities: [
        { label: '3 hrs', value: 60 * 3 },
        { label: '6 hrs', value: 60 * 6 },
        { label: '1 day', value: 60 * 24 }
      ],
      isGranularitySelectDisabled: true,
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
    uploadFile (file, updateProgress) {
      this.resetData()
      return new Promise((resolve, reject) => {
        resolve(file)
      })
    },
    uploaded (file) {
      const reader = new FileReader()

      reader.onload = (evt) => {
        const inputData = evt.target.result
        console.time('parse data')
        const parsedData = this.parseData(inputData)
        console.timeEnd('parse data')

        this.dataset = parsedData
        this.isUserSelectDisabled = false
      }
      reader.readAsText(file)
    },
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
      this.isGranularitySelectDisabled = true
      this.isStartDateSelectDisabled = true
      this.isComparisonDateSelectDisabled = true
    },
    parseData (data) {
      const times = {}
      const users = {}

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

          // 出現過的 user 用 object 存，讓他不會重複
          result.forEach((field, index) => {
            if (index === 0) times[field] = true
            if (index === 1) users[field] = true
          })

          return result
        })

      // 把 times 存起來要設 granularity
      for (const prop in times) {
        this.allTimes.push(prop)
      }
      const newTimes = [this.allTimes[0]]
      this.allTimes.forEach((time) => {
        if (new Date(time) - new Date(newTimes[newTimes.length - 1]) >= this.granularity * 60 * 1000) {
          newTimes.push(time)
        }
      })
      this.times = newTimes
      // 把 user 存起來給下拉選單用
      for (const prop in users) {
        this.users.push(prop)
        this.userOptions.push({ label: prop, value: prop })
      }

      return parsedData
    },
    userOnChange (user) {
      d3.select('.chart').selectAll('*').remove()
      this.userBpsPerDate = []
      this.minStartDate = ''
      this.maxStartDate = ''
      this.startDate = ''
      this.comparisonDate = ''
      this.isGranularitySelectDisabled = true
      this.isStartDateSelectDisabled = true

      // const userData = this.dataset.filter((item) => item[1] === user)
      // const result = this.accumulateBpsPerDate(userData)
      const aggregatedData = this.aggregate(this.dataset, 'users')
      const transferredData = this.transfer(aggregatedData, 'users', this.granularity)
      // console.log('result: ', result)
      console.log('aggregatedData: ', aggregatedData)
      console.log('transferredData: ', transferredData)
      const selectedData = transferredData.map((date) => {
        const targetUserIndex = this.users.indexOf(user)
        return [date[date.length - 1], date[targetUserIndex]]
      })
      const result = selectedData
      console.log('selectedData: ', selectedData)
      this.aggregatedData = aggregatedData
      this.userBpsPerDate = result

      const dates = result.map((item) => item[0])
      this.defaulteStartDate = dates[0]
      this.minStartDate = dates[0]
      this.maxStartDate = dates[dates.length - 1]
      this.isGranularitySelectDisabled = false
      this.isStartDateSelectDisabled = false
    },
    granularityOnChange () {
      const newTimes = [this.times[0]]
      // note: 可能可以改用 this.times.filter
      this.allTimes.forEach((time, index) => {
        if (new Date(time) - new Date(newTimes[newTimes.length - 1]) >= this.granularity * 60 * 1000) {
          newTimes.push(time)
        }
      })
      this.times = newTimes
      const transferredData = this.transfer(this.aggregatedData, 'users', this.granularity)
      console.log('transferredData: ', transferredData)
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
    aggregate (parsedData, type) {
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

      parsedData.forEach((item) => {
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
    transfer (aggregatedData, type, granularity) {
      const transferredData = []
      let count = 0
      let newRow = Array(this[type].length).fill(0)
      Object.entries(aggregatedData).forEach((row, index) => {
        // 建立一個只放 bps 的 array
        if (new Date(row[0]) - new Date(this.times[count]) >= granularity * 60 * 1000) {
          // 把 X 軸的 label 放進去做二維 table
          newRow.push(this.times[count])
          transferredData.push(newRow)
          newRow = Array(this[type].length).fill(0)
          count++
        }
        for (const field in row[1]) {
          const fieldIndex = this[type].indexOf(field)
          newRow[fieldIndex] += row[1][field]
        }
        if (index === this.allTimes.length - 1) {
          newRow.push(this.times[count])
          transferredData.push(newRow)
        }
      })
      return transferredData
    },
    startDateOnChange (value) {
      d3.select('.chart').selectAll('*').remove()

      const date = value.slice(0, 10)
      const startIndex = this.userBpsPerDate.findIndex((item) => item[0].slice(0, 10) === date)
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
      const bpsArr = baseDates.map((item) => item[1])
      const comparisonBpsArr = comparisonDates.map((item) => item[1])
      const allData = bpsArr.concat(comparisonBpsArr)

      const min = d3.min(allData) * 0.95
      const max = d3.max(allData) * 1.05

      const padData = (data, pushOrUnshift) => {
        const paddedData = data.slice()
        // 相當之醜
        for (let i = pushOrUnshift === 'push' ? paddedData.length - 1 : 0; paddedData.length < weekDays; pushOrUnshift === 'push' ? i++ : '') {
          paddedData[pushOrUnshift]([
            pushOrUnshift === 'push'
              ? new Date(new Date(paddedData[i][0]).getTime() + 86400000).toISOString().slice(0, 10)
              : new Date(new Date(paddedData[i][0]).getTime() - 86400000).toISOString().slice(0, 10),
            min
          ])
        }
        return paddedData
      }

      const paddedBaseDates = padData(baseDates, 'push')
      const paddedComparisonDates = padData(comparisonDates, 'unshift')
      const growthRates = paddedBaseDates.map((item, index) => [
        item[0],
        paddedComparisonDates[index][1] === min // 檢查上週數據是否為最小值
          ? 0 // 成長率是無限的話，先設為 0
          : item[1] === min // 上週數據不是最小值，檢查這週數據是否為最小值
            ? Math.round(((0 - paddedComparisonDates[index][1]) / paddedComparisonDates[index][1]) * 100) // 這週數據是最小值，用 0 計算成長率(其實成長率就是 -100%)
            : Math.round(((item[1] - paddedComparisonDates[index][1]) / paddedComparisonDates[index][1]) * 100) // 這週數據不是最小值，計算成長率
      ])
      console.log({ growthRates, paddedBaseDates, paddedComparisonDates, min })

      const xLinear = d3.scaleBand()
        .domain(paddedBaseDates.map((item) => item[0]))
        .range([0, chartWidth])

      const comparisonXLinear = d3.scaleBand()
        .domain(paddedComparisonDates.map((item) => item[0]))
        .range([0, chartWidth])

      const yLinear = d3.scaleLinear()
        .domain([min, max])
        .range([0, chartHeight])

      const reverseYLinear = d3.scaleLinear()
        .domain([max, min])
        .range([0, chartHeight])

      // const reverseLineYLinear = d3.scaleLinear()
      //   .domain([max, min])
      //   .range([0, chartHeight])

      const rateYLinear = d3.scaleLinear()
        .domain([d3.max(growthRates.map((item) => item[1])), d3.min(growthRates.map((item) => item[1]))])
        .range([0, chartHeight])
      // const rateYLinear = d3.scaleLinear()
      //   .domain([100, -100])
      //   .range([0, chartHeight])

      const chart = d3.select('.chart')
        .attr('width', chartWidth)
        .attr('height', chartHeight)

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
      const rateYAxis = d3.axisRight(rateYLinear)
        .tickFormat((d) => d + '%')

      chart.append('g')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(xAxis)
      chart.append('g').call(comparisonXAxis)
      chart.append('g').call(yAxis)
      chart.append('g')
        .attr('transform', `translate(${chartHeight}, 0)`)
        .call(rateYAxis)

      const interval = ((chartWidth - (paddedBaseDates.length * barWidth)) / (paddedBaseDates.length))
      chart.selectAll('rect')
        .data(paddedBaseDates.map((item) => item[1]))
        .enter()
        .append('rect')
        .attr('x', (d, i) => i * (barWidth + interval) + (interval / 2))
        .attr('y', (d) => chartHeight - yLinear(d))
        .attr('width', barWidth)
        .attr('height', (d) => yLinear(d))
        .attr('fill', '#5F4B8B')
        .attr('class', 'bars')

      chart.append('path')
        .datum(growthRates.map((item) => item[1]))
        .attr('fill', 'none')
        .attr('stroke', '#FEDE00')
        .attr('stroke-width', 2)
        .attr('d', d3.line()
          .x((d, i) => i * (barWidth + interval) + (interval / 2) + (barWidth / 2))
          .y((d) => rateYLinear(d))
        )
        .attr('class', 'line')

      // =======================try tooltip======================

      const tooltip = d3.select('.chart-container')
        .append('div')
        .attr('id', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', '#d3d3d3')
        .text("I'm a circle!")

      chart.on('mouseover', () => tooltip.style('visibility', 'visible'))
        .on('mousemove', () => tooltip.style('top', (event.pageY - 80) + 'px').style('left', (event.pageX + 20) + 'px'))
        .on('mouseout', () => tooltip.style('visibility', 'hidden'))

      // ===========================================================

      // ========================origin bar chart===================

      // chart.selectAll('rect')
      //   .on('mouseover', (d, i) => {
      //     console.log(d, paddedComparisonDates.map((item) => item[1])[i])
      //     bars.append('text')
      //       .text(d)
      //       .attr('y', chartHeight - yLinear(d) - 6)
      //       .attr('x', i * (barWidth + interval) + (interval / 2) + (barWidth / 2))
      //       .style('fill', '#000')
      //       .style('font-size', '12px')
      //       .style('font-weight', 'bold')
      //       .style('text-anchor', 'middle')
      //       .attr('class', 'tooltip')
      //   })
      //   .on('mouseout', () => bars.select('.tooltip').remove())

      // const bars = chart.selectAll('g')
      //   .data(paddedBaseDates.map((item) => item[1]))
      //   .enter()
      //   .append('g')

      // const interval = ((chartWidth - (paddedBaseDates.length * barWidth)) / (paddedBaseDates.length))
      // bars.append('rect')
      //   .attr('x', (d, i) => i * (barWidth + interval) + (interval / 2))
      //   .attr('y', (d) => chartHeight - yLinear(d))
      //   .attr('width', barWidth)
      //   .attr('height', (d) => yLinear(d))
      //   .attr('fill', '#5F4B8B')

      // bars.append('text')
      //   .attr('y', (d) => chartHeight - yLinear(d) - 6)
      //   .attr('x', (d, i) => i * (barWidth + interval) + (interval / 2) + (barWidth / 2))
      //   .style('fill', '#000')
      //   .style('font-size', '12px')
      //   .style('font-weight', 'bold')
      //   .style('text-anchor', 'middle')
      //   .text((d) => d)

      // ===========================================================
    }
  }
}
</script>
