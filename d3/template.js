// BOXPLOT
// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#boxplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const xScale = d3.scaleBand()
        .domain([...new Set(data.map(d => d.Platform))])
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Likes)])
        .range([height, 0]);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom)
        .style("text-anchor", "middle")
        .text("Platform")
        .attr("class", "axis-label");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Number of Likes")
        .attr("class", "axis-label");

    // Calculate statistics for each platform
    const boxPlotData = d3.rollups(data, group => {
        const values = group.map(d => d.Likes).sort(d3.ascending);
        return {
            q1: d3.quantile(values, 0.25),
            median: d3.quantile(values, 0.5),
            q3: d3.quantile(values, 0.75),
            iqr: d3.quantile(values, 0.75) - d3.quantile(values, 0.25),
            min: d3.min(values),
            max: d3.max(values)
        };
    }, d => d.Platform);

    // Draw box plots
    boxPlotData.forEach(([platform, stats]) => {
        const x = xScale(platform);
        const width = xScale.bandwidth();

        // Draw box
        svg.append("rect")
            .attr("x", x)
            .attr("y", yScale(stats.q3))
            .attr("width", width)
            .attr("height", yScale(stats.q1) - yScale(stats.q3))
            .attr("class", "box");

        // Draw median line
        svg.append("line")
            .attr("x1", x)
            .attr("x2", x + width)
            .attr("y1", yScale(stats.median))
            .attr("y2", yScale(stats.median))
            .attr("class", "median-line");

        // Draw whiskers
        svg.append("line")
            .attr("x1", x + width/2)
            .attr("x2", x + width/2)
            .attr("y1", yScale(stats.min))
            .attr("y2", yScale(stats.q1))
            .attr("stroke", "black");

        svg.append("line")
            .attr("x1", x + width/2)
            .attr("x2", x + width/2)
            .attr("y1", yScale(stats.q3))
            .attr("y2", yScale(stats.max))
            .attr("stroke", "black");

        // Draw whisker caps
        svg.append("line")
            .attr("x1", x + width/4)
            .attr("x2", x + 3*width/4)
            .attr("y1", yScale(stats.min))
            .attr("y2", yScale(stats.min))
            .attr("stroke", "black");

        svg.append("line")
            .attr("x1", x + width/4)
            .attr("x2", x + 3*width/4)
            .attr("y1", yScale(stats.max))
            .attr("y2", yScale(stats.max))
            .attr("stroke", "black");
    });
});


// BARPLOT
// Prepare you data and load the data again.
// This data should contains three columns, platform, post type and average number of likes.

const socialMediaAvg = d3.csv("socialMedia.csv").then(function(data) {
    // Process data to get average likes by platform and post type
    const groupedData = d3.rollup(data,
        v => d3.mean(v, d => +d.Likes),
        d => d.Platform,
        d => d.PostType
    );

    // Convert nested map to array format needed for plotting
    const plotData = Array.from(groupedData, ([platform, postTypes]) => 
        Array.from(postTypes, ([postType, avgLikes]) => ({
            Platform: platform,
            PostType: postType,
            AvgLikes: avgLikes
        }))
    ).flat();

    // Define the dimensions and margins for the SVG
    const margin = { top: 40, right: 150, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#barplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define four scales
  // Scale x0 is for the platform, which divide the whole scale into 4 parts
  // Scale x1 is for the post type, which divide each bandwidth of the previous x0 scale into three part for each post type
  // Recommend to add more spaces for the y scale for the legend
  // Also need a color scale for the post type
    const x0 = d3.scaleBand()
        .domain([...new Set(plotData.map(d => d.Platform))])
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain([...new Set(plotData.map(d => d.PostType))])
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(plotData, d => d.AvgLikes)])
        .range([height, 0])
        .nice();

    const color = d3.scaleOrdinal()
        .domain([...new Set(plotData.map(d => d.PostType))])
        .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

    // Add scales x0 and y
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text("Platform")
        .attr("class", "axis-label");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 15)
        .attr("x", -height / 2)
        .style("text-anchor", "middle")
        .text("Average Number of Likes")
        .attr("class", "axis-label");

    // Group container for bars
    const platformGroups = svg.selectAll(".platform-group")
        .data(plotData)
        .join("g")
        .attr("class", "platform-group")
        .attr("transform", d => `translate(${x0(d.Platform)},0)`);

    // Draw bars
    platformGroups.append("rect")
        .attr("x", d => x1(d.PostType))
        .attr("y", d => y(d.AvgLikes))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.AvgLikes))
        .attr("fill", d => color(d.PostType))
        .attr("class", "bar");

    // Add the legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 20}, 0)`);

    const postTypes = [...new Set(plotData.map(d => d.PostType))];

    postTypes.forEach((type, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 25})`);
            
        legendRow.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(type));
            
        legendRow.append("text")
            .attr("x", 25)
            .attr("y", 12)
            .style("font-size", "12px")
            .text(type);
    });
});

// LINEPLOT
// Prepare you data and load the data again. 
// This data should contains two columns, date (3/1-3/7) and average number of likes. 
const socialMediaTime = d3.csv("socialMedia.csv");

socialMediaTime.then(function(data) {
    // Group data and calculate averages
    const groupedData = d3.rollup(
        data,
        posts => d3.mean(posts, d => +d.Likes), // Calculate mean likes
        d => d.Date.split(' ')[0] // Group by date (removing time)
    );

    // Format data for plotting
    const plotData = Array.from(groupedData, ([date, avgLikes]) => ({
        Date: date.split('/').slice(0,2).join('/'), // Format as M/D
        AvgLikes: avgLikes
    })).sort((a,b) => new Date(a.Date) - new Date(b.Date)); // Sort by date

    // Define dimensions and margins
    const margin = { top: 40, right: 60, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3.select("#lineplot")  // Changed from "body" to "#lineplot"
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const xScale = d3.scaleBand()
        .domain(plotData.map(d => d.Date))
        .range([0, width])
        .padding(0.5);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(plotData, d => d.AvgLikes)])
        .range([height, 0])
        .nice();

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text("Date")
        .attr("class", "axis-label");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .style("text-anchor", "middle")
        .text("Average Number of Likes")
        .attr("class", "axis-label");

    // Create and add the line
    const line = d3.line()
        .x(d => xScale(d.Date) + xScale.bandwidth() / 2)
        .y(d => yScale(d.AvgLikes))
        .curve(d3.curveNatural);

    svg.append("path")
        .datum(plotData)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);
});