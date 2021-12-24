<template>
  <div style="min-width: 500px; max-width: 90vw;">
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
  methods: {
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

      const reverseLineYLinear = d3.scaleLinear()
        .domain([max, min])
        .range([0, chartHeight])

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

      chart.append('g')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(xAxis)
      chart.append('g').call(comparisonXAxis)
      chart.append('g').call(yAxis)

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
        .datum(paddedComparisonDates.map((item) => item[1]))
        .attr('fill', 'none')
        .attr('stroke', '#FEDE00')
        .attr('stroke-width', 2)
        .attr('d', d3.line()
          .x((d, i) => i * (barWidth + interval) + (interval / 2) + (barWidth / 2))
          .y((d) => reverseLineYLinear(d))
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
    }
  }
}
</script>
