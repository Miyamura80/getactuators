import { TrendListSchema, TrendParams, trendListView } from "@/api/trends";
import { ToolInputError, defineTool } from "../tool";

// /trends over MCP: dated, cited points per chart.

const getTrends = defineTool({
    name: "get_trends",
    title: "Get trends over time",
    description:
        "How key quantities have moved over time, from /trends (mostly the last decade; the AI price comparisons reach back to 1892): actuator list prices and $/N·m (Dynamixel, CubeMars, mjbots, Unitree, Xiaomi, Steadywin, RobStride), strain-wave gear rated life, humanoid shipments by company, Chinese brands' share of China's industrial robot market, the rotary/linear split in humanoids, planetary roller screw cost, the price of AI against DNA sequencing, compute, batteries and electricity (Epoch AI) and per unit of R&D (Karthik Tadepalli), and humanoid battery runtime. Every point has a date, a confidence (reported, estimated or modeled) and sources with reuse terms. Pass section (actuators, ai, misc) or chart to narrow.",
    input: TrendParams,
    output: TrendListSchema,
    run: (filter) => {
        const view = trendListView(filter);
        if (view.count === 0)
            throw new ToolInputError("No chart matches this section and chart id.");
        return view;
    },
});

export const trendTools = [getTrends];
