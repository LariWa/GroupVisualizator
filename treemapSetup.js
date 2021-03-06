export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([
    ["flare-2.json", new URL("./data/data", import.meta.url)],
  ]);

  let groupMembers = [];

  main.builtin(
    "FileAttachment",
    runtime.fileAttachments((name) => fileAttachments.get(name))
  );
  main.variable(observer()).define(["md"], function (md) {
    return md`
# Group Matching Tool

      This treemap supports zooming: click any cell to zoom in, or the top to zoom out.
      Further, does it allow for the selection of group members. You can see the group score below the treemap.`;
  });
  main
    .variable(observer("chart"))
    .define(
      "chart",
      ["d3", "width", "height", "treemap", "data", "name", "format", "DOM"],
      function (d3, width, height, treemap, data, name, format, DOM) {
        const x = d3.scaleLinear().rangeRound([0, width]);
        const y = d3.scaleLinear().rangeRound([0, height]);

        const svg = d3
          .create("svg")
          .attr("viewBox", [0.5, -30.5, width, height + 30])
          .style("font", "10px sans-serif");

        let group = svg.append("g").call(render, treemap(data));

        function render(group, root) {
          const node = group
            .selectAll("g")
            .data(root.children.concat(root))
            .join("g");

          node
            .filter((d) => (d === root ? d.parent : d.children))
            .attr("cursor", "pointer")
            .on("click", (event, d) =>
              d === root ? zoomout(root) : zoomin(d)
            );
          node
            .filter((d) => d.height === 0)
            .attr("cursor", "pointer")
            .on("mouseenter", (event, d) => hover(event, d))
            .on("mouseleave", (event, d) => endHover(d))
            .on("click", (event, d) => updateGroup(event, d));

          node
            .append("title")
            .text((d) => `${name(d)}\n${parseInt(d.value) / 100}`);

          node
            .append("rect")
            .attr("id", (d) => (d.leafUid = DOM.uid("leaf")).id)
            .attr("value", (d) => d.data.ID)
            .attr("name", (d) => `${name(d)}`)
            .attr("fill", (d) =>
              d === root ? "#fff" : d.children ? "#ccc" : "#ddd"
            )
            .attr("stroke", "#fff");

          node
            .append("clipPath")
            .attr("id", (d) => (d.clipUid = DOM.uid("clip")).id)
            .append("use")
            .attr("xlink:href", (d) => d.leafUid.href);

          node
            .append("text")
            .attr("clip-path", (d) => d.clipUid)
            .attr("font-weight", (d) => (d === root ? "bold" : null))
            .selectAll("tspan")
            .data((d) =>
              (d === root ? name(d) : d.data.name)
                .split(/(?=[A-Z][^A-Z])/g)
                .concat(parseInt(d.value) / 100)
            )
            .join("tspan")
            .attr("x", 3)
            .attr(
              "y",
              (d, i, nodes) =>
                `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
            )
            .attr("fill-opacity", (d, i, nodes) =>
              i === nodes.length - 1 ? 0.7 : null
            )
            .attr("font-weight", (d, i, nodes) =>
              i === nodes.length - 1 ? "normal" : null
            )
            .text((d) => d);

          group.call(position, root);
        }

        function position(group, root) {
          group
            .selectAll("g")
            .attr("transform", (d) =>
              d === root
                ? `translate(0,-30)`
                : `translate(${x(d.x0)},${y(d.y0)})`
            )
            .select("rect")
            .attr("width", (d) => (d === root ? width : x(d.x1) - x(d.x0)))
            .attr("height", (d) => (d === root ? 30 : y(d.y1) - y(d.y0)));
        }
        function updateGroup(event, data) {
          let element = $("#" + event.target.id)[0];
          let value = element.getAttribute("value");
          let name = element.getAttribute("name");

          console.log(data.data.art / 100);

          let obj = {
            value: value,
            name: name.substring(name.lastIndexOf("/") + 1, name.length),
            art: data.data.art / 100,
            math: data.data.math / 100,
            programming: data.data.Programming / 100,
            visualization: data.data.infoVisualization / 100,
            teamwork: data.data.TeamWork / 100,
          };

          if (groupMembers.some((member) => member.value === value)) {
            $("#" + event.target.id).removeClass("select");
            groupMembers.splice(search(value), 1);
          } else {
            groupMembers.push(obj);
          }

          $("#members").text("");
          showMembers();
          calculateScore();
        }

        function search(value) {
          for (var i = 0; i < groupMembers.length; i++) {
            if (groupMembers[i].value === value) {
              return i;
            }
          }
        }

        function showMembers() {
          if (!$("#members").length > 0) {
            $("#group-members-").append('<div id="members"></div>');
          }

          $.each(groupMembers, function (index, obj) {
            let element = "rect[value=" + obj.value + "]";
            $(element).addClass("select");
            $("#members").append(obj.name + "<br>");
          });
        }

        function calculateScore() {
          if (!$("#scoreValues").length > 0) {
            $("#score-").append('<p id="scoreValues"></p>');
          }

          let art = 0;
          let math = 0;
          let programming = 0;
          let visualization = 0;
          let teamwork = 0;

          $.each(groupMembers, function (index, obj) {
            art += obj.art;
            math += obj.math;
            programming += obj.programming;
            visualization += obj.visualization;
            teamwork += obj.teamwork;
          });

          $("#scoreValues").text(
            "Art: " +
              (art / groupMembers.length).toFixed(2) +
              ", Math: " +
              (math / groupMembers.length).toFixed(2) +
              ", Programming: " +
              (programming / groupMembers.length).toFixed(2) +
              ", Visualization: " +
              (visualization / groupMembers.length).toFixed(2) +
              ", Teamwork: " +
              (teamwork / groupMembers.length).toFixed(2)
          );
          var chart = document.getElementById("scoreBarchart");
          if (chart) chart.remove();

          const margin = {
              top: 20,
              right: 30,
              bottom: 30,
              left: 90,
            },
            width = 300 - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;
          var padding = 40;
          // append the svg object to the body of the page
          const svg = d3
            .select("#scoreBar")
            .append("div")
            .attr("id", "scoreBarchart")

            .append("svg")
            .attr("id", "scorebarchartSVG")

            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

          const x = d3.scaleLinear().domain([0, 10]).range([0, width]);
          svg
            .append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

          // data = d.data.barData;
          data = [
            { name: "Art", value: art / groupMembers.length },
            { name: "Math ", value: math / groupMembers.length },
            {
              name: "Programming",
              value: programming / groupMembers.length,
            },

            {
              name: "Info \n Visu..",
              value: visualization / groupMembers.length,
            },
            { name: "Team Work", value: teamwork / groupMembers.length },
          ];
          console.log(data);
          // Y axis
          const y = d3
            .scaleBand()
            .range([0, height])
            .domain(data.map((d) => d.name))
            .padding(0.1);
          svg.append("g").call(d3.axisLeft(y));

          //Bars
          svg
            .selectAll("myRect")
            .data(data)
            .join("rect")
            .attr("x", x(0))
            .attr("y", (d) => y(d.name))
            .attr("width", (d) => x(d.value))
            .attr("height", y.bandwidth())
            .attr("fill", "#69b3a2");
        }

        // When zooming in, draw the new nodes on top, and fade them in.
        function zoomin(d) {
          const group0 = group.attr("pointer-events", "none");
          const group1 = (group = svg.append("g").call(render, d));

          x.domain([d.x0, d.x1]);
          y.domain([d.y0, d.y1]);

          svg
            .transition()
            .duration(750)
            .call((t) => group0.transition(t).remove().call(position, d.parent))
            .call((t) =>
              group1
                .transition(t)
                .attrTween("opacity", () => d3.interpolate(0, 1))
                .call(position, d)
            );

          $("#members").text("");
          showMembers();
        }
        function hover(event, d, node) {
          //console.log("enter");
          // set the dimensions and margins of the graph
          const margin = { top: 20, right: 30, bottom: 30, left: 90 },
            width = 300 - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;
          var padding = 40;
          // append the svg object to the body of the page

          const svg = d3
            .select("#my_dataviz")
            .append("div")
            .attr("id", "barchart")
            .append("svg")
            .attr("id", "barchartSVG")

            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
          d3.select("#my_dataviz")
            .style("position", "absolute")
            .style("top", getOffset(event.target).top + 50 + "px")
            .style("left", getOffset(event.target).left + 50 + "px");

          const x = d3.scaleLinear().domain([0, 10]).range([0, width]);
          svg
            .append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

          // data = d.data.barData;
          data = [
            { name: "Art", value: d.data.art / 100 },
            { name: "Math ", value: d.data.math / 100 },
            { name: "Programming", value: d.data.Programming / 100 },

            {
              name: "Info \n Visu..",
              value: d.data.infoVisualization / 100,
            },
            { name: "Team Work", value: d.data.TeamWork / 100 },
          ];
          // Y axis
          const y = d3
            .scaleBand()
            .range([0, height])
            .domain(data.map((d) => d.name))
            .padding(0.1);
          svg.append("g").call(d3.axisLeft(y));

          //Bars
          svg
            .selectAll("myRect")
            .data(data)
            .join("rect")
            .attr("x", x(0))
            .attr("y", (d) => y(d.name))
            .attr("width", (d) => x(d.value))
            .attr("height", y.bandwidth())
            .attr("fill", "#69b3a2");
          d3.select(barchart)
            .append("p")
            .text("Interests: " + d.data.hobbies);
          // d3.select(barchart)
          //   .append("p")
          //   .text("Previous classes: " + d.data.Courses);
        }
        function endHover() {
          //console.log("leave");
          document.getElementById("barchart").remove();
        }
        function getOffset(el) {
          const rect = el.getBoundingClientRect();
          return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY,
          };
        }
        // When zooming out, draw the old nodes on top, and fade them out.
        function zoomout(d) {
          const group0 = group.attr("pointer-events", "none");
          const group1 = (group = svg.insert("g", "*").call(render, d.parent));

          x.domain([d.parent.x0, d.parent.x1]);
          y.domain([d.parent.y0, d.parent.y1]);

          svg
            .transition()
            .duration(750)
            .call((t) =>
              group0
                .transition(t)
                .remove()
                .attrTween("opacity", () => d3.interpolate(1, 0))
                .call(position, d)
            )
            .call((t) => group1.transition(t).call(position, d.parent));
        }

        return svg.node();
      }
    );

  main.variable(observer()).define(["md"], function (md) {
    return md`
## Group Members:`;
  });

  main.variable(observer()).define(["md"], function (md) {
    return md`
## Score:`;
  });

  main
    .variable(observer("data"))
    .define("data", ["FileAttachment"], function (FileAttachment) {
      return FileAttachment("flare-2.json").json();
    });
  main
    .variable(observer("treemap"))
    .define("treemap", ["d3", "tile"], function (d3, tile) {
      return (data) =>
        d3.treemap().tile(tile)(
          d3
            .hierarchy(data)
            .sum((d) => d.value)
            .sort((a, b) => b.value - a.value)
        );
    });
  main.variable(observer()).define(["md"], function (md) {
    //return md`This custom tiling function adapts the built-in binary tiling function for the appropriate aspect ratio when the treemap is zoomed-in.`;
  });
  main
    .variable(observer("tile"))
    .define("tile", ["d3", "width", "height"], function (d3, width, height) {
      return function tile(node, x0, y0, x1, y1) {
        d3.treemapBinary(node, 0, 0, width, height);
        for (const child of node.children) {
          child.x0 = x0 + (child.x0 / width) * (x1 - x0);
          child.x1 = x0 + (child.x1 / width) * (x1 - x0);
          child.y0 = y0 + (child.y0 / height) * (y1 - y0);
          child.y1 = y0 + (child.y1 / height) * (y1 - y0);
        }
      };
    });
  main.variable(observer("name")).define("name", function () {
    return (d) =>
      d
        .ancestors()
        .reverse()
        .map((d) => d.data.name)
        .join("/");
  });
  main.variable(observer("width")).define("width", function () {
    return 954;
  });
  main.variable(observer("height")).define("height", function () {
    return 400;
  });
  main.variable(observer("format")).define("format", ["d3"], function (d3) {
    return d3.format(",d");
  });
  main.variable(observer("d3")).define("d3", ["require"], function (require) {
    return require("d3@6");
  });
  //return main;
}
