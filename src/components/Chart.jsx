
import React from "react";
import PropTypes from "prop-types";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { utcMinute } from "d3-time";

import { ChartCanvas, Chart, ZoomButtons } from "react-stockcharts";
import {
	BarSeries,
	CandlestickSeries,
} from "react-stockcharts/lib/series";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
	CrossHairCursor,
	MouseCoordinateX,
	MouseCoordinateY,
} from "react-stockcharts/lib/coordinates";

import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";
import {
	OHLCTooltip,
} from "react-stockcharts/lib/tooltip";
import { fitWidth } from "react-stockcharts/lib/helper";
import { last } from "react-stockcharts/lib/utils";
import { timeIntervalBarWidth } from "react-stockcharts/lib/utils/barWidth";

class CandleStickChartWithZoomPan extends React.Component {
	constructor(props) {
		super(props);
		this.saveNode = this.saveNode.bind(this);
		this.resetYDomain = this.resetYDomain.bind(this);
		this.handleReset = this.handleReset.bind(this);
	}
	componentWillMount() {
		this.setState({
			suffix: 1
		});
	}
	saveNode(node) {
		this.node = node;
	}
	resetYDomain() {
		this.node.resetYDomain();
	}
	handleReset() {
		this.setState({
			suffix: this.state.suffix + 1
		});
	}
	render() {
		const { type, width, ratio } = this.props;
		const { mouseMoveEvent, panEvent, zoomEvent, zoomAnchor } = this.props;
		const { clamp } = this.props;

		const { data: initialData } = this.props;

		const xScaleProvider = discontinuousTimeScaleProvider
			.inputDateAccessor(d => d.date);
		const {
			data,
			xScale,
			xAccessor,
			displayXAccessor,
		} = xScaleProvider(initialData);

		const start = xAccessor(last(data));
		const end = xAccessor(data[Math.max(0, data.length - 150)]);
		const xExtents = [start, end];

		const margin = { left: 70, right: 70, top: 20, bottom: 30 };

		const height = 400;

		const gridHeight = height - margin.top - margin.bottom;
		const gridWidth = width - margin.left - margin.right;

		const showGrid = true;
		const yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.2 } : {};
		const xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.2 } : {};

		const candlesAppearance = {
			wickStroke: "#000000",
			fill: function fill(d) {
				return d.close > d.open ? "rgba(196, 205, 211, 0.8)" : "rgba(22, 22, 22, 0.8)";
			},
			stroke: "#000000",
			candleStrokeWidth: 1,
			widthRatio: 0.8,
			opacity: 1,
		}

		return (
				<ChartCanvas ref={this.saveNode} height={height}
					ratio={ratio}
					width={width}
					margin={{ left: 70, right: 70, top: 10, bottom: 30 }}

					mouseMoveEvent={mouseMoveEvent}
					panEvent={panEvent}
					zoomEvent={zoomEvent}
					clamp={clamp}
					zoomAnchor={zoomAnchor}
					type={type}
					seriesName={`MSFT_${this.state.suffix}`}
					data={data}
					xScale={xScale}
					xExtents={xExtents}
					xAccessor={xAccessor}
					displayXAccessor={displayXAccessor}
				>

					<Chart id={1}
						yExtents={d => [d.high, d.low]}
					>
						<XAxis axisAt="bottom"
							orient="bottom"
							zoomEnabled={zoomEvent}
							{...xGrid} />
						<YAxis axisAt="right"
							orient="right"
							ticks={5}
							zoomEnabled={zoomEvent}
							{...yGrid}
						/>

						<MouseCoordinateY
							at="right"
							orient="right"
							displayFormat={format(".2f")} />

						<CandlestickSeries {...candlesAppearance} width={timeIntervalBarWidth(utcMinute.every(1))}/>
						<OHLCTooltip origin={[-40, 0]}/>
						<ZoomButtons
							onReset={this.handleReset}
						/>
					</Chart>
					<Chart id={2}
						yExtents={d => d.volume}
						height={150} origin={(w, h) => [0, h - 150]}
					>
						<YAxis
							axisAt="left"
							orient="left"
							ticks={5}
							tickFormat={format(".2s")}
							zoomEnabled={zoomEvent}
						/>

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

CandleStickChartWithZoomPan.propTypes = {
	data: PropTypes.array.isRequired,
	width: PropTypes.number.isRequired,
	ratio: PropTypes.number.isRequired,
	type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

CandleStickChartWithZoomPan.defaultProps = {
	type: "svg",
	mouseMoveEvent: true,
	panEvent: true,
	zoomEvent: true,
	clamp: false,
};

CandleStickChartWithZoomPan = fitWidth(CandleStickChartWithZoomPan);

export default CandleStickChartWithZoomPan;
