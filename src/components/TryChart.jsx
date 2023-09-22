
import React from "react";
import PropTypes from "prop-types";

import { scaleLinear, scaleTime } from "d3-scale";
import { utcDay } from "d3-time";

import { ChartCanvas, Chart } from "react-stockcharts";
import { BarSeries, CandlestickSeries } from "react-stockcharts/lib/series";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import { fitWidth } from "react-stockcharts/lib/helper";
import { last, timeIntervalBarWidth } from "react-stockcharts/lib/utils";
import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";
import { CrossHairCursor, MouseCoordinateX, MouseCoordinateY } from "react-stockcharts/lib/coordinates";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

class CandleStickChart extends React.Component {
	render() {
		const { type, width, data: initialData, ratio } = this.props;
        const xScaleProvider = discontinuousTimeScaleProvider
			.inputDateAccessor(d => d.date);
		const {
			data,
			xScale,
			xAccessor,
			displayXAccessor,
		} = xScaleProvider(initialData);
        console.log(this.props);
        const candlesAppearance = {
			wickStroke: function fill(d) {
				return d.close > d.open ? "#01A781" : "#E44B44";
			},
			fill: function fill(d) {
				return d.close > d.open ? "#01A781" : "#E44B44";
			},
			stroke: "#000000",
			candleStrokeWidth: 1,
			widthRatio: 0.8,
			opacity: 1,
		}
		return (
			<ChartCanvas height={400}
					ratio={ratio}
					width={width}
					margin={{ left: 50, right: 50, top: 10, bottom: 30 }}
					type={type}
					seriesName="MSFT"
					data={data}
                    xScaleProvider={discontinuousTimeScaleProvider}
					xAccessor={xAccessor}
					xScale={xScale}
                    displayXAccessor={displayXAccessor}
                    xExtents={[0, data.length]}>

				<Chart id={1} yExtents={d => [d.high, d.low]}>
					<XAxis axisAt="bottom" orient="bottom" ticks={6}/>
					<YAxis axisAt="left" orient="left" ticks={5} />
					<CandlestickSeries {...candlesAppearance} width={10}/>
				</Chart>
                <Chart id={2}
                    yExtents={d => d.volume}
                    height={150} origin={(w, h) => [0, h - 150]}
                >
                    <MouseCoordinateX
                        at="bottom"
                        orient="bottom"
                        displayFormat={timeFormat("%Y-%m-%d")} />
                    <MouseCoordinateY
                        at="left"
                        orient="left"
                        displayFormat={format(".4s")} />

                    <BarSeries yAccessor={d => d.volume} fill={(d) => d.close > d.open ? "#6BA583" : "#FF0000"} />
                </Chart>
                <CrossHairCursor />
			</ChartCanvas>
		);
	}
}

CandleStickChart.propTypes = {
	data: PropTypes.array.isRequired,
	width: PropTypes.number.isRequired,
	ratio: PropTypes.number.isRequired,
	type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

CandleStickChart.defaultProps = {
	type: "svg",
};
CandleStickChart = fitWidth(CandleStickChart);

export default CandleStickChart;
