<template>
  <div style="min-width: 500px; width: 90vw; max-width: 800px;">
    <p class="caption">
      Single File Upload
    </p>
    <q-uploader
      id="uploader"
      :multiple="false"
      :url="''"
      :upload-factory="uploadFile"
      @uploaded="uploaded"
    />
    <p class="caption">Granularity</p>
    <q-select
      id="granularity-selector"
      v-model="granularity"
      :options="granularityOptions"
      :disable="isGranularitySelectDisabled"
    />
    <p class="caption">User</p>
    <q-select
      id="user-selector"
      v-model="user"
      :options="userOptions"
      :disable="isUserSelectDisabled"
    />
    <p class="caption">Base date</p>
    <q-datetime
      id="base-time-selector"
      v-model="baseTime"
      type="date"
      :display-value="baseTimeDisplayValue"
      :default-value="minBaseTime"
      :min="minBaseTime"
      :max="maxBaseTime"
      :disable="isBaseTimeSelectDisabled"
    />
    <p class="caption">Comparison date</p>
    <q-select
      id="comparison-time-selector"
      v-model="comparisonTime"
      :options="validComparisonTimes"
      :disable="isComparisonTimesSelectDisabled"
    />
    <div class="chart-container">
      <svg class="chart" />
    </div>
  </div>
</template>

<script>
import { Loading } from 'quasar'
import * as d3 from 'd3'
import moment from 'moment'
import { mixin } from './mixin'

const WEEKDAYS = 7

export default {
  name: 'BarChart',
  data () {
    return {
      firstTier: 'users',
      secondTier: 'times',
      inputData: '',
      allTimes: [],
      users: [],
      user: '',
      userOptions: [],
      isUserSelectDisabled: true,
      granularity: 60 * 24,
      granularityOptions: [
        { label: '3 hrs', value: 60 * 3 },
        { label: '6 hrs', value: 60 * 6 },
        { label: '1 day', value: 60 * 24 }
      ],
      isGranularitySelectDisabled: true,
      baseTime: '',
      comparisonTime: [],
      isBaseTimeSelectDisabled: true,
      isComparisonTimesSelectDisabled: true
    }
  },
  computed: {
    parsedData () {
      return this.parseData(this.inputData)
    },
    allDates () {
      return this.getAllDates(this.allTimes)
    },
    partitionsPerDay () {
      return 1440 / this.granularity
    },
    baseTimeDisplayValue () {
      if (!this.baseTime) return ''
      return `${moment(this.baseTime).format('YYYY-MM-DD')} ~ ${moment(this.baseTime).add(6, 'd').format('YYYY-MM-DD')}`
    },
    minBaseTime () {
      return this.allDates[0]
    },
    maxBaseTime () {
      return this.allDates[this.allDates.length - 1]
    },
    aggregatedData () {
      const transferredData = this.transfer(this.parsedData, this.firstTier)

      const secondTransferredData = {}
      for (const key in transferredData) {
        secondTransferredData[key] = this.transfer(transferredData[key], this.secondTier)
      }

      return this.aggregate(secondTransferredData)
    },
    granulatedData () {
      return this.granulateAggregatedData(this.aggregatedData, this.granularity)
    },
    userData () {
      const emptyData = ['', []]
      const userData = this.granulatedData.find((item) => item[0] === this.user) || emptyData
      return userData[1]
    },
    times () {
      return this.granulateTimes(this.allTimes, this.granularity)
    },
    range () {
      return this.partitionsPerDay * WEEKDAYS
    },
    baseDates () {
      const baseDateIndex = this.allDates.indexOf(this.baseTime.slice(0, 10))
      return this.allDates.slice(baseDateIndex, baseDateIndex + WEEKDAYS)
    },
    baseTimeIndex () {
      const baseTime = this.baseTime.slice(0, 10)
      return this.userData.findIndex((item) => item[0].slice(0, 10) === baseTime)
    },
    baseTimes () {
      return this.userData.slice(this.baseTimeIndex, this.baseTimeIndex + this.range)
    },
    validComparisonTimes () {
      const validComparisonTimes = []
      if (this.baseTimeIndex === 0) return validComparisonTimes
      for (let i = this.baseTimeIndex - this.range; i + this.range > 0; i -= this.range) {
        const endIndex = i + this.range - 1
        if (i < 0) i = 0
        validComparisonTimes.push({
          label: `${this.userData[i][0].slice(0, 10)} ~ ${this.userData[endIndex][0].slice(0, 10)}`,
          value: [this.userData[i][0].slice(0, 10), endIndex - i]
        })
      }
      return validComparisonTimes
    },
    comparisonDates () {
      const comparisonDates = this.comparisonTimes.reduce((datesObj, time) => {
        datesObj[time[0].slice(0, 10)] = true
        return datesObj
      }, {})
      return Object.keys(comparisonDates)
    },
    comparisonTimes () {
      // 如果 this.comparisonTime[0] 直接放 index，會造成出圖後再更改 granularity 時，拿到的會是舊的 index
      const comparisonTime = this.comparisonTime[0]
      // 如果不用 offset，直接用 comparisonTimeIndex + this.range，會變成如果 validComparisonTimes 不到七天 ex. 11/1-11/3，會抓成 11/1-11/7
      const comparisonTimeOffset = this.comparisonTime[1]
      const comparisonTimeIndex = this.userData.findIndex((item) => item[0].slice(0, 10) === comparisonTime)
      return this.userData.slice(comparisonTimeIndex, comparisonTimeIndex + comparisonTimeOffset + 1)
    }
  },
  watch: {
    // NOTE: 這個乍看之下是多餘的操作，目的是當 this.validComparisonTimes 改變，要更新 this.comparisonTime
    // 而觸發 this.validComparisonTimes 改變的 dependencies 包含 this.inputData、this.granularity、this.user、this.baseTime
    // 如果沒有這個 watcher，當重新選擇 user 或重新上傳 inputData 時，chart 雖然還在，但是 comparison date selector 會空掉
    validComparisonTimes (value) {
      // if (!this.comparisonTime.length || !this.validComparisonTimes.length) return // NOTE: 好像是多餘的檢查
      const emptyData = { label: '', value: [] }
      // NOTE: this.comparisonTime 是一個 array，e.g. ['2021-11-10', 6]，包含時間跟最後一筆要用到的 offset，所以要重新抓
      // 可能原本的是 ['2021-11-10', 6]，granularity 更新後，變成 ['2021-11-10', 27]
      const foundComparisonTime = this.validComparisonTimes.find((item) => item.value[0] === this.comparisonTime[0]) || emptyData
      this.comparisonTime = foundComparisonTime.value
    },
    granularity (value) {
      d3.select('.chart').selectAll('*').remove()

      // FIXME: 跟 validComparisonTimes watcher 重複了，應該可以留在 validComparisonTimes watcher 就好
      // if (!this.comparisonTime.length) return // NOTE: 好像是多餘的檢查
      // const emptyData = { label: '', value: [] }
      // const foundComparisonTime = this.validComparisonTimes.find((item) => item.value[0] === this.comparisonTime[0]) || emptyData
      // this.comparisonTime = foundComparisonTime.value

      if (!value || !this.user || !this.baseTime || !this.comparisonTime.length) return // comparisonTime 是個 array, e.g. ['2021-11-10', 6]
      this.renderBarChart(this.baseTimes, this.comparisonTimes)
    },
    user (value) {
      d3.select('.chart').selectAll('*').remove()

      if (value) this.isBaseTimeSelectDisabled = false

      if (!value || !this.baseTime || !this.comparisonTime.length) return // comparisonTime 是個 array, e.g. ['2021-11-10', 6]
      this.renderBarChart(this.baseTimes, this.comparisonTimes)
    },
    baseTime (value) {
      d3.select('.chart').selectAll('*').remove()
      if (value) this.isComparisonTimesSelectDisabled = false
    },
    comparisonTime (value) {
      if (!value.length) return // comparisonTime 是個 array, e.g. ['2021-11-10', 6]
      this.renderBarChart(this.baseTimes, this.comparisonTimes)
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
        // reset
        this.allTimes = []
        this.users = []
        this.userOptions = []

        this.inputData = evt.target.result

        this.isGranularitySelectDisabled = false
        this.isUserSelectDisabled = false
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
        times[time] = time
        const user = result[1]
        users[user] = user
        parsedData.push(result)
      }

      for (const prop in times) {
        this.allTimes.push(prop)
      }

      for (const prop in users) {
        this.users.push(prop)
        this.userOptions.push({ label: prop, value: prop })
      }
      this.user = this.users[0]

      return parsedData
    },
    /**
     * 描述
     * @param {array} times - All value of the time field of the parsedData.
     * @returns {array}
     */
    getAllDates (times) {
      return times.reduce((acc, cur) => {
        const date = cur.slice(0, 10)
        if (!acc.includes(date)) return [...acc, date]
        return acc
      }, [])
    },
    /**
     * 描述
     * @param {array} baseTimes - Bps per selected granularity of the base times.
     * @param {array} comparisonTimes - Bps per selected granularity of the comparison times.
     */
    renderBarChart (baseTimes, comparisonTimes) {
      d3.select('.chart').selectAll('*').remove()
      // console.log('renderBarChart has been called')

      const margin = {
        top: 50,
        right: 60,
        bottom: 50,
        left: 60
      }
      const chartWidth = 920 - margin.left - margin.right
      const chartHeight = 600 - margin.top - margin.bottom
      const barWidth = 50 / this.partitionsPerDay

      const bpsArr = baseTimes.map((item) => item[1])
      const comparisonBpsArr = comparisonTimes.map((item) => item[1])
      const allData = bpsArr.concat(comparisonBpsArr)

      const min = d3.min(allData) * 0.95
      const max = d3.max(allData) * 1.05

      // padData 跟 padDates 想辦法寫成一個 function
      const padData = (data, pushOrUnshift, granularity, length) => {
        if (data.length <= 0) return data // watcher 似乎會把整個相關的 code 都跑一遍，所以一開始 data 是空陣列就直接原封不動 return data，才不會噴錯
        const paddedData = data.slice()
        // 相當之醜
        for (let i = pushOrUnshift === 'push' ? paddedData.length - 1 : 0; paddedData.length < length; pushOrUnshift === 'push' ? i++ : '') {
          paddedData[pushOrUnshift]([
            pushOrUnshift === 'push'
              ? moment(new Date(paddedData[i][0]).getTime() + (granularity * 60 * 1000)).format('YYYY-MM-DD HH:mm:ss')
              : moment(new Date(paddedData[i][0]).getTime() - (granularity * 60 * 1000)).format('YYYY-MM-DD HH:mm:ss'),
            min
          ])
        }
        return paddedData
      }

      const padDates = (dates, pushOrUnshift, granularity, length) => {
        // if (dates.length <= 0) return dates // watcher 似乎會把整個相關的 code 都跑一遍，所以一開始 dates 是空陣列就直接原封不動 return dates，才不會噴錯
        const paddedDates = dates.slice()
        // 相當之醜
        for (let i = pushOrUnshift === 'push' ? paddedDates.length - 1 : 0; paddedDates.length < length; pushOrUnshift === 'push' ? i++ : '') {
          paddedDates[pushOrUnshift](
            pushOrUnshift === 'push'
              ? moment(new Date(paddedDates[i]).getTime() + (granularity * 60 * 1000)).format('YYYY-MM-DD')
              : moment(new Date(paddedDates[i]).getTime() - (granularity * 60 * 1000)).format('YYYY-MM-DD')
          )
        }
        return paddedDates
      }

      // console.log('baseTimes: ', baseTimes)
      // console.log('comparisonTimes: ', comparisonTimes)
      const paddedBaseTimes = padData(baseTimes, 'push', this.granularity, this.range)
      const paddedComparisonTimes = padData(comparisonTimes, 'unshift', this.granularity, this.range)
      const paddedBaseDates = padDates(this.baseDates, 'push', 60 * 24, WEEKDAYS)
      const paddedComparisonDates = padDates(this.comparisonDates, 'unshift', 60 * 24, WEEKDAYS)
      // console.log('paddedBaseTimes: ', paddedBaseTimes)
      // console.log('paddedComparisonTimes: ', paddedComparisonTimes)
      // console.log('paddedBaseDates: ', paddedBaseDates)
      // console.log('paddedComparisonDates: ', paddedComparisonDates)
      const growthRates = paddedBaseTimes.map((item, index) => [
        item[0],
        paddedComparisonTimes[index][1] === min // 檢查上週數據是否為最小值
          ? 0 // 成長率是無限的話，先設為 0
          : item[1] === min // 上週數據不是最小值，檢查這週數據是否為最小值
            ? -100 // 這週數據是最小值，用 0 計算成長率(其實成長率就是 -100%)
            : Math.round(((item[1] - paddedComparisonTimes[index][1]) / paddedComparisonTimes[index][1]) * 100) // 這週數據不是最小值，計算成長率
      ])
      // console.log('growthRates: ', growthRates)

      // the SVG
      const chart = d3.select('.chart')
        .attr('width', chartWidth + margin.left + margin.right)
        .attr('height', chartHeight + margin.top + margin.bottom)
        .attr('transform', `translate(-${margin.left})`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

      // prepare for axes
      const xLinear = d3.scaleBand()
        .domain(paddedBaseDates)
        .range([0, chartWidth])
      const comparisonXLinear = d3.scaleBand()
        .domain(paddedComparisonDates)
        .range([0, chartWidth])
      const yLinear = d3.scaleLinear()
        .domain([min, max])
        .range([0, chartHeight])
      const reverseYLinear = d3.scaleLinear()
        .domain([max, min])
        .range([0, chartHeight])
      const rateYLinear = d3.scaleLinear()
        .domain([d3.max([100, ...growthRates.map((item) => item[1])]), -100])
        .range([0, chartHeight])

      const xAxis = d3.axisBottom(xLinear)
      const comparisonXAxis = d3.axisTop(comparisonXLinear)
      const yAxis = d3.axisLeft(reverseYLinear)
        .tickFormat((d) => {
          let remainder = d
          let counter = 0
          while (remainder > 1024) {
            remainder = Math.round(remainder / 1024)
            counter++
          }
          const units = ['b/s', 'Kb/s', 'Mb/s', 'Gb/s']
          return remainder + units[counter]
        })
      const rateYAxis = d3.axisRight(rateYLinear)
        .tickFormat((d) => d + '%')

      // draw axes
      chart.append('g')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(xAxis)
        .selectAll('text')
      chart.append('g')
        .call(comparisonXAxis)
        .selectAll('text')
      chart.append('g')
        .call(yAxis)
      chart.append('g')
        .attr('transform', `translate(${chartWidth}, 0)`)
        .call(rateYAxis)

      // draw bars
      const interval = ((chartWidth - (paddedBaseTimes.length * barWidth)) / (paddedBaseTimes.length))
      chart.selectAll('rect')
        .data(paddedBaseTimes.map((item) => item[1]))
        .enter()
        .append('rect')
        .attr('x', (d, i) => i * (barWidth + interval) + (interval / 2))
        .attr('y', (d) => chartHeight - yLinear(d))
        .attr('width', barWidth)
        .attr('height', (d) => yLinear(d))
        .attr('fill', '#5F4B8B')
        .attr('class', 'bars')

      // draw line
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

      // draw tooltip
      const xFullLinear = d3.scaleBand()
        .domain(paddedBaseTimes.map((item) => item[0]))
        .range([0, chartWidth])

      // custom invert function, reference: https://bl.ocks.org/shimizu/808e0f5cadb6a63f28bb00082dc8fe3f
      xFullLinear.invert = (function () {
        const domain = xFullLinear.domain()
        const range = xFullLinear.range()
        const scale = d3.scaleQuantize().domain(range).range(domain)
        return function (x) {
          return scale(x)
        }
      })()

      const guideLine = chart.append('line')
        .attr('class', 'guideLine')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', chartHeight)
        .attr('stroke', 'red')
      const tooltipCircle = chart
        .append('g')
        .append('circle')
        .style('fill', 'none')
        .attr('stroke', 'black')
        .attr('r', 4)
        .style('opacity', 0)
      const focusTexts = chart
        .append('g')
        .style('opacity', 0)
        .style('fill', 'black')
        .style('font-size', '0.8rem')
        .attr('text-anchor', 'left')
        .attr('alignment-baseline', 'middle')
      const tooltipHeight = 15 * 6 + 16
      const tooltipBackground = focusTexts.append('rect')
        .attr('width', 180)
        .attr('height', tooltipHeight)
        .style('fill', 'rgba(255, 255, 255, 0.95)')
        .style('stroke', '#d9d9d9')
        .style('filter', 'url(#shadow)')
        .attr('rx', 3)
        .attr('ry', 3)
      focusTexts.append('text')
        .attr('class', 'comparison-date-label')
        .style('fill', '#808080')
      focusTexts.append('text')
        .attr('class', 'comparison-date-value')
      focusTexts.append('text')
        .attr('class', 'base-date-label')
        .style('fill', '#808080')
      focusTexts.append('text')
        .attr('class', 'base-date-value')
      focusTexts.append('text')
        .attr('class', 'growth-rate-label')
        .style('fill', '#808080')
      focusTexts.append('text')
        .attr('class', 'growth-rate-value')
      chart.append('rect')
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .attr('width', chartWidth)
        .attr('height', chartHeight)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout)
      chart.append('defs')
        .append('filter')
        .attr('id', 'shadow')
        .append('feDropShadow')
        .attr('dx', 2)
        .attr('dy', 2)
        .attr('stdDeviation', 4)
        .attr('flood-color', 'rgb(0 0 0 / 10%)')

      function mouseover () {
        tooltipCircle.style('opacity', 1)
        focusTexts.style('opacity', 1)
        guideLine.style('opacity', '1')
      }

      function mousemove () {
        // get mouse coordinate
        const xy = d3.mouse(chart.node())
        // get nearest X axis scale
        const d = xFullLinear.invert(xy[0])
        // get nearest X axis scale x coordinate
        const nx = xFullLinear(d) + (xFullLinear.bandwidth() / 2)
        // get nearest Y axis scale y coordinate
        const index = growthRates.findIndex((item) => item[0] === d)
        const ny = rateYLinear(growthRates[index][1])

        guideLine
          .attr('x1', nx)
          .attr('x2', nx)
        tooltipCircle
          .attr('cx', nx)
          .attr('cy', ny)
        focusTexts.select('.comparison-date-label')
          .html('Comparison Time:')
          .transition()
          .ease(d3.easeLinear)
          .duration(100)
          .attr('x', nx + 15 + 18)
          .attr('y', ny - 37)
        focusTexts.select('.comparison-date-value')
          .html(paddedComparisonTimes[index][0])
          .transition()
          .ease(d3.easeLinear)
          .duration(100)
          .attr('x', nx + 15 + 18)
          .attr('y', ny - 22)
        focusTexts.select('.base-date-label')
          .html('Base Time:')
          .transition()
          .ease(d3.easeLinear)
          .duration(100)
          .attr('x', nx + 15 + 18)
          .attr('y', ny - 7)
        focusTexts.select('.base-date-value')
          .html(growthRates[index][0])
          .transition()
          .ease(d3.easeLinear)
          .duration(100)
          .attr('x', nx + 15 + 18)
          .attr('y', ny + 7)
        focusTexts.select('.growth-rate-label')
          .html('Growth Rate:')
          .transition()
          .ease(d3.easeLinear)
          .duration(100)
          .attr('x', nx + 15 + 18)
          .attr('y', ny + 22)
        focusTexts.select('.growth-rate-value')
          .html(`${growthRates[index][1]}%`)
          .transition()
          .ease(d3.easeLinear)
          .duration(100)
          .attr('x', nx + 15 + 18)
          .attr('y', ny + 37)
        tooltipBackground
          .transition()
          .ease(d3.easeLinear)
          .duration(100)
          .attr('x', nx + 15)
          .attr('y', ny - (tooltipHeight / 2) - 5)
      }
      function mouseout () {
        tooltipCircle.style('opacity', 0)
        focusTexts.style('opacity', 0)
        guideLine.style('opacity', '0')
      }
    }
  }
}
</script>
