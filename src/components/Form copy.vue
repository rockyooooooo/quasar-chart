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
    <q-table
      :loading="isLoading"
      title="Table Title"
      :data="dataset"
      :columns="columns"
      row-key="name"
    />
    <q-btn @click="flipTable">Flip</q-btn>
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
      isComparisonDateSelectDisabled: true,
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
          field: (item) => item[5]
        }
      ],
      isLoading: false
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
        this.isLoading = true
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
        this.isLoading = false
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
      const bpsArr = baseDates.map((item) => item[1])
      const comparisonBpsArr = comparisonDates.map((item) => item[1])
      const allData = bpsArr.concat(comparisonBpsArr)

      const min = d3.min(allData) * 0.95
      const max = d3.max(allData) * 1.05

      const padData = (data, pushOrUnshift) => {
        const paddedData = data.slice()
        for (let i = paddedData.length; paddedData.length < weekDays; i++) {
          paddedData[pushOrUnshift]([`null${i}`, min])
        }
        return paddedData
      }

      const paddedBaseDates = padData(baseDates, 'push')
      const paddedComparisonDates = padData(comparisonDates, 'unshift')
      const growthRates = paddedBaseDates.map((item, index) => [
        item[0],
        paddedComparisonDates[index][1] === min // 檢查上週數據是否為最小值
          ? 999 // 成長率是無限的話，先設為 999
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

      // const tooltip = d3.select('.chart-container').append('div')
      //   .attr('id', 'tooltip')
      //   .style('position', 'absolute')
      //   .style('background-color', '#D3D3D3')
      //   .style('padding', 6)
      //   .style('display', 'none')

      // const mouseG = chart.append('g')
      //   .attr('class', 'mouse-over-effects')

      // mouseG.append('path')
      //   .attr('class', 'mouse-line')
      //   .style('stroke', '#A9A9A9')
      //   .style('stroke-width', '2px')
      //   .style('opacity', '0')

      // // const line = d3.select('.line')
      // const nestedData = [{ key: 'baseDates', values: baseDates }, { key: 'comparisonDates', values: comparisonDates }]
      // console.log(nestedData)

      // const mousePerLine = mouseG.selectAll('.mouse-per-line')
      //   .data(nestedData)
      //   .enter()
      //   .append('g')
      //   .attr('class', 'mouse-per-line')

      // mousePerLine.append('circle')
      //   .attr('r', 4)
      //   .style('stroke', '#2D4057')
      //   .style('fill', 'none')
      //   .style('stroke-width', '2px')
      //   .style('opacity', '0')

      // mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
      //   .attr('width', 500)
      //   .attr('height', 500)
      //   .attr('fill', 'none')
      //   .attr('pointer-events', 'all')
      //   .on('mouseout', function () { // on mouse out hide line, circles and text
      //     d3.select('.mouse-line')
      //       .style('opacity', '0')
      //     d3.selectAll('.mouse-per-line circle')
      //       .style('opacity', '0')
      //     d3.selectAll('.mouse-per-line text')
      //       .style('opacity', '0')
      //     d3.selectAll('#tooltip')
      //       .style('display', 'none')
      //   })
      //   .on('mouseover', function () { // on mouse in show line, circles and text
      //     d3.select('.mouse-line')
      //       .style('opacity', '1')
      //     d3.selectAll('.mouse-per-line circle')
      //       .style('opacity', '1')
      //     d3.selectAll('#tooltip')
      //       .style('display', 'block')
      //   })
      //   .on('mousemove', function () { // update tooltip content, line, circles and text when mouse moves
      //     var mouse = d3.mouse(this)

      //     d3.selectAll('.mouse-per-line')
      //       .attr('transform', function (d, i) {
      //         console.log(mouse)
      //         var xDate = xLinear.invert(mouse[0]) // use 'invert' to get date corresponding to distance from mouse position relative to svg
      //         var bisect = d3.bisector(function (d) { return d.date }).left // retrieve row index of date on parsed csv
      //         var idx = bisect(d.values, xDate)

      //         d3.select('.mouse-line')
      //           .attr('d', function () {
      //             var data = 'M' + xLinear(d.values[idx].date) + ',' + (500)
      //             data += ' ' + xLinear(d.values[idx].date) + ',' + 0
      //             return data
      //           })
      //         return 'translate(' + xLinear(d.values[idx].date) + ',' + yLinear(d.values[idx].premium) + ')'
      //       })

      //     updateTooltipContent(mouse, nestedData)
      //   })

      // function updateTooltipContent (mouse, nestedData) {
      //   console.log(mouse)
      //   tooltip
      //     .style('display', 'block')
      //     .style('left', d3.event.pageX + 20)
      //     .style('top', d3.event.pageY - 20)
      //     .style('font-size', 11.5)
      //     .selectAll()
      //     .data(nestedData).enter() // for each vehicle category, list out name and price of premium
      //     .append('div')
      //     .style('color', '#2D4057')
      //     .style('font-size', 10)
      //     .html(d => d)
      // }

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
    },
    flipTable () {
      const tbodyTrs = d3.select('tbody')
        .selectAll('tr')

      const temp = []
      tbodyTrs.forEach((item, i) => {
        item.forEach((elem, j) => {

        })
      })
      console.log(temp)
    }
  }
}
</script>
