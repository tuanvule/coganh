export function createTreeSimulation() {
    const $ = document.querySelector.bind(document)
    const $$ = document.querySelectorAll.bind(document)

    const code_rows = $$(".code_row")
    // const return_value_ouput = $(".return_value_ouput")
    // let data = {
    //     name: "Root",
    //     value: "",
    //     MOX: 0,
    //     children: [
    //         {
    //         name: "A",
    //         value: "",
    //         MOX: 1,
    //         children: [
    //             {
    //             name: "A1",
    //             value: '',
    //             MOX: 0,
    //             children: [
    //                 {
    //                 name: "C",
    //                 value: "",
    //                 children: [
    //                     { name: "C1", value: 3, MOX: 1, children: [] },
    //                     { name: "C2", value: 5, MOX: 1, children: [] }
    //                 ]
    //                 }
    //             ]
    //             },
    //             { name: "A2", value: 5, MOX: 0, children: [] }
    //         ]
    //         },
    //         {
    //         name: "B",
    //         value: "",
    //         MOX: 1,
    //         children: [
    //             { name: "B1", value: 2, MOX: 0, children: [] },
    //             { name: "B2", value: 9, MOX: 0, children: [] }
    //         ]
    //         },
    //         {
    //             name: "D",
    //             value: "",
    //             MOX: 1,
    //             children: [
    //                 { name: "D1", value: 2, MOX: 0, children: [] },
    //                 { name: "D2", value: 100, MOX: 0, children: [] }
    //             ]
    //             }
    //     ]
    // };

    let root = {
        name: "Root",
        value: "-inf",
        default_value: "-inf",
        MOX: 0,
        depth: 0,
        children: [
            {
            name: "A",
            value: "+inf",
            default_value: "+inf",
            MOX: 1,
            depth: 1,
            children: [
                {
                name: "A1",
                value: "-inf",
                default_value: "-inf",
                MOX: 0,
                depth: 2,
                children: [
                    {
                    name: "C",
                    value: "+inf",
                    depth: 3,
                    default_value: "+inf",
                    MOX: 1,
                    children: [
                        { name: "C1", value: 3, default_value: 3, depth: 4, MOX: 0, children: [] },
                        { name: "C2", value: 5, default_value: 5, depth: 4, MOX: 0, children: [] }
                    ]
                    }
                ]
                },
                { name: "A2", value: 5, default_value: 5, depth: 2, MOX: 0, children: [] }
            ]
            },
            {
            name: "B",
            value: "+inf",
            default_value: "+inf",
            MOX: 1,
            depth: 1,
            children: [
                { name: "B1", value: 2, default_value: 2, depth: 2, MOX: 0, children: [] },
                { name: "B2", value: 9, default_value: 9, depth: 2, MOX: 0, children: [] }
            ]
            },
            {
            name: "D",
            value: "+inf",
            default_value: "+inf",
            MOX: 1,
            depth: 1,
            children: [
                { name: "D1", value: 2, default_value: 2, depth: 2, MOX: 0, children: [] },
                { name: "D2", value: 100, default_value: 100, depth: 2, MOX: 0, children: [] }
            ]
            }
        ]
    };

    let svg = d3.select("svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height")
    let g = svg.append("g").attr("transform", "translate(0,100)");

    let tree = d3.tree().size([width, height - 160]);

    let rootD3 = d3.hierarchy(root);

    tree(rootD3);
    
    let nodes = rootD3.descendants();
    let depth = nodes.reduce((depth, node) => node.depth > depth ? node.depth : depth, 0)
    let links = rootD3.links();

    const node_name = $(".node_name")
    const node_value = $(".node_value")
    const duration_bar = $(".duration_bar")
    const visualize_speed = $(".visualize_speed")
    const show_data_change = $(".show_data_change")
    const play_pause_btn = $("#play_pause_btn")
    const minimax_list = $(".minimax_list")

    return ({
        content: g,
        link: null,
        node: null,
        group: null,
        speed: 1,
        circle_r: 20,
        root_history: [],
        selected_node: {},
        isPaused: false,
        animation_index: 0,
        is_animation_end: true,
        is_hightlight_result: false,
        is_rewind: false,
        data_change: [],
        action: [], 
        code_row_animation: [],
        
        algorithm: "",

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms / this.speed));
        },

        async run_algorithm(alg, ...arg) {
            this.code_row_animation = []
            this.algorithm = alg
            this.action = []
            switch(alg) {
                case "minimax":
                    this.action = []
                    await this.minimax(rootD3, 0, true)
                    this.code_row_animation.push([[1,2], "true"])
                    break
                default:
                    break
            }
            this.data_change = []
            await this.save_data_change()
        },

        async play_visualize() {
            this.animation_index = 0
            this.Play()
            this.reset_hightlight_result()
            // await this.pause()
            this.isPaused = true
            await this.animate_all_nodes(nodes)
            this.isPaused = false
            // await this.sleep(500)
            // await this.pause()
            if(this.is_animation_end) {
                await this.reset_hightlight_result()
                await this.play_animation(0)
            }
        },

        async minimax(node, depth) {
            if (depth === 4 || !node.children || node.children.length === 0) {
                this.action.push({node, time: 0})
                return node.data.value;
            }
          
            let bestValue;
            if (!node.data.MOX) {
                bestValue = -Infinity;
                for (let child of node.children) {
                    let value = await this.minimax(child, depth + 1);
                    // console.log("MAX: ",value)
                    this.code_row_animation.push([[7,8,9,10], "true"])
                    if (value > bestValue) {
                        bestValue = value;
                        node.selectedChild = child; // Cập nhật node.selectedChild khi tìm thấy giá trị tốt hơn
                        node.data.value = bestValue;
                    }
                }
            } else {
                bestValue = Infinity;
                for (let child of node.children) {
                    let value = await this.minimax(child, depth + 1);
                    this.code_row_animation.push([[15,16,17,18], "true"])
                    if (value < bestValue) {
                        bestValue = value;
                        node.selectedChild = child; // Cập nhật selectedChild khi tìm thấy giá trị tốt hơn
                        node.data.value = bestValue;
                    }
                }
            }
            this.action.push({node, time: 500})
            // await this.sleep(500);
            // await callback(node);
            return bestValue;
        },

        async save_data_change() {
            let _this = this
            function d(node) {
                let a = []
                for(let child of node.children) {
                    d(child)
                    a.push(child.value)
                    _this.data_change.push([...a])
                }
            }
            d(root)
        },

        async show_data_change(node, i) {
            if(node.selectedChild) {
                show_data_change.innerHTML = (node.data.MOX === 0 ? "Max" : "Min") + " = " + node.data.value.toString()
                await this.sleep(1000)
            }
            show_data_change.innerHTML = i === this.action.length - 1 ? "nhánh tốt nhất có giá trị: " + root.value : JSON.stringify(this.data_change[i])
        },


        async findPath(start_node, end_node) {
            let path = [];
            function traverse(node) {
              if (node === end_node) {
                path.push(node);
                return true;
              }
              if (node.children) {
                for (let child of node.children) {
                  if (traverse(child)) {
                    path.push(node);
                    return true;
                  }
                }
              }
              return false;
            }
            traverse(start_node);
            return path.reverse();
        },
      
        async highlightPath(start_node, end_node) {
            const path = await this.findPath(start_node, end_node);
            for (let i = 0; i < path.length - 1; i++) {
              const source = path[i];
              const target = path[i + 1];
              this.link.filter(d => d.source === source && d.target === target)
                .transition()
                .duration(500 / this.speed)
                .attr("stroke", "lightgreen")
                .attr("stroke-width", "4px");
            }
        },

        // hightlight code roww
        async hightlight(row,type) {
            console.log(row)
            if(row.length === 1) {
                code_rows[row[0]].classList.add("round_top", "round_bottom")
            } else {
                code_rows[row[0]].classList.add("round_top")
                code_rows[row[row.length-1]].classList.add("round_bottom")
            }
            row.forEach(item => {
                code_rows[item].classList.add(type)
            })
        },

        // clear hightlight code roww
        async clear_hightlight(row,type) {
            code_rows.forEach(item => item.classList.remove("run", "true", "false", "round_top", "round_bottom"))
        },

        async animate_all_nodes(nodes) {
            let _this = this
            async function animate(node) {
                for(let child of node.children) {
                    for(let i = 0; i <= (child.MOX === 0 ? 7 : 15); i++) {
                        await _this.sleep(50 / ((child.MOX === 0 ? 7 : 15) / 7))
                        await _this.hightlight([i], "true")
                    }
                    // await _this.pause()
                    
                    let nod = d3.select(`.node.${child.name}`)
                    
                    let circle = nod.select(`circle`)
                    circle
                    .transition()
                    .duration(500 / _this.speed)
                    .attr("fill", "#ff6565")
                    let text = nod.select("text")
                    .text(d => d.data.default_value)
                    await _this.sleep(500)
                    await _this.clear_hightlight()
                    await animate(child)
                }
            }
            for(let i = 0; i <= (root.MOX === 0 ? 7 : 15); i++) {
                await _this.sleep(50)
                await _this.hightlight([i], "true")
            }
            // await this.pause()
            let nod = d3.select(`.node.Root`)
            
            let circle = nod.select(`circle`)
            circle
            .transition()
            .duration(500 / this.speed)
            .attr("fill", "#ff6565")
            let text = nod.select("text")
            .text(d => d.data.default_value)
            await this.sleep(500)
            await _this.clear_hightlight()
            await animate(root)
            // for(let i = 0; i < nodes.length; i++) {
            //     await this.pause()
            //     await this.sleep(100)
            //     let nod = d3.select(`.node.${nodes[i].data.name}`)

            //     let circle = nod.select(`circle`)
            //     circle
            //     .transition()
            //     .duration(500 / this.speed)
            //     .attr("fill", "#ff6565")
            //     let text = nod.select("text")
            //     .text(d => d.data.default_value)
            // }
        },

        async pause() {
            while (this.isPaused) {
                await this.sleep(100);
            }
        },

        async changeColor(node, isFastForward = false, isFastBack = false) {
            const nodeElement = this.content.selectAll(".node").filter(d => d.data.name === node.data.name);
            if(isFastBack) {
                nodeElement.select("text").text(d => `${d.data.default_value}`);
                if(!nodeElement.select("rect").empty()) {
                    const group = nodeElement.select("g.node_log")
                    const text = group.select("text")
                    text
                    .transition()
                    .attr("opacity", 0)
                }
                return
            }
            // default mode
            if(!isFastForward) {
                nodeElement.select("circle").transition().duration(500 / this.speed).attr("fill", "#ffcc00");
                const linkElement = this.content.selectAll(".link").filter(d => d.source.data.name === node.data.name);
                linkElement.transition().duration(500 / this.speed).attr("stroke", "#ffcc00");
                
                // await this.pause()
            
                if(!nodeElement.select("rect").empty()) {
                    const group = nodeElement.select("g.node_log")
                    const rect = group.select("rect")
                    const text = group.select("text")
                    await this.sleep(500)
                    rect
                    .transition()
                    // .duration(500 / this.speed)
                    
                    text
                    .transition()
                    .duration(500 / this.speed)
                    .attr("opacity", 1)
                    .text(d => {
                        const {value} = d.data
                        return d.data.MOX !== 0 ? `MIN = ${value}` :  `MAX = ${value}`
                    })
                }
                await this.sleep(1000)
                // nodeElement.select("rect").transition().duration(500 / this.speed).attr("fill", "red");
                nodeElement.select("text").text(d => `${d.data.value}`);
                await this.pause()
                nodeElement.select("circle").transition().duration(500 / this.speed).attr("fill", "#fff");
                
                // Thay đổi màu sắc của liên kết
                await this.pause()
                await this.sleep(500)
            
                linkElement.transition().duration(500 / this.speed).attr("stroke", "#555");
            } else {
                nodeElement.select("text").text(d => `${d.data.value}`);
                if(!nodeElement.select("rect").empty()) {
                    const group = nodeElement.select("g.node_log")
                    const text = group.select("text")
                    
                    text
                    .transition()
                    .attr("opacity", 1)
                    .text(d => {
                        const {value} = d.data
                        // print("rect", d.depth % 2 != 0 ? `MIN = ${value}` :  `MAX = ${value}`)
                        return d.data.MOX !== 0 ? `MIN = ${value}` :  `MAX = ${value}`
                    })
                }
            }
        },

        async highlight_result(pre_root) {
            this.is_animation_end = true
            this.is_hightlight_result = true
            let current = pre_root;
            while (current.selectedChild) {
              this.node.filter(n => n === current)
                .select("circle")
                .transition()
                .duration(500 / this.speed)
                .attr("fill", "#fff")
                .attr("stroke", "#007BFF")
                .attr("stroke-width", "3px")
    
              this.link.filter(l => {
                    // print(l.source, l.target)
                    return l.source === current && l.target === current.selectedChild
                })
                .transition()
                .duration(500 / this.speed)
                .attr("stroke", "#007BFF")
                .attr("stroke-width", "3px");
        
              current = current.selectedChild;
            }
        
            this.node.filter(n => n === current)
              .select("circle")
              .transition()
              .duration(500 / this.speed)
              .attr("stroke", "#007BFF")
              .attr("stroke-width", "3px")
        },

        async reset_hightlight_result(type) {
            switch(type) {
                case "link":
                    this.link
                    .transition()
                    .duration(500 / this.speed)
                    .attr("stroke", "#555")
                    .attr("stroke-width", "2px")
                    .attr("fill", "none")
                    break
                case "node":
                    this.node.selectAll("circle")
                    .transition()
                    .duration(500 / this.speed)
                    .attr("fill", "#fff")
                    .attr("stroke", "#999")
                    .attr("stroke-width", "1px")
                    break
                default:
                    this.link
                    .transition()
                    .duration(500 / this.speed)
                    .attr("stroke", "#555")
                    .attr("stroke-width", "2px")
                    .attr("fill", "none")
                    this.node.selectAll("circle")
                    .transition()
                    .duration(500 / this.speed)
                    .attr("fill", "#fff")
                    .attr("stroke", "#999")
                    .attr("stroke-width", "1px")
                    break
            }
        },

        async play_one_frame(frame, next) {
            this.speed = 4
            let dem = frame
            let dem2 = frame
            duration_bar.value = (frame / (this.action.length - 1)) * 100
            while(dem--) {
                let {node,time} = this.action[dem]
                await this.changeColor(node, true)
            }
            while(dem2 < this.action.length) {
                let {node,time} = this.action[dem2]
                await this.changeColor(node, true, true)
                dem2++
            }
            let {node,time} = this.action[frame]
            await this.reset_hightlight_result()
            await this.highlightPath(rootD3, node)
            await this.sleep(time);
            this.show_data_change(node, this.animation_index)
            await this.changeColor(node);

            // if(this.animation_index === this.action.length - 1) {
            //     // await this.pause()
            // }
            if(frame === this.action.length - 1) {
                dem = frame
                while(dem--) {
                    let {node,time} = this.action[dem]
                    await this.changeColor(node, true)
                }
                await this.highlight_result(rootD3)
                this.is_animation_end = true
            }
        },

        async play_animation(start) {
            this.speed = Number(visualize_speed.value)
            this.animation_index = start
            if(this.is_hightlight_result && this.animation_index < this.action.length - 1) {
                this.reset_hightlight_result()
                this.is_hightlight_result = false
            } 
            if(this.is_animation_end) {
                this.is_animation_end = false
                while(this.animation_index < this.action.length) {
                    let dem = this.animation_index
                    let dem2 = this.animation_index
                    duration_bar.value = (this.animation_index / (this.action.length - 1)) * 100
                    while(dem--) {
                        let {node,time} = this.action[dem]
                        await this.changeColor(node, true)
                    }
                    while(dem2 < this.action.length - 1) {
                        let {node,time} = this.action[dem2]
                        await this.changeColor(node, true, true)
                        dem2++
                    }
                    let {node,time} = this.action[this.animation_index]
                    await this.pause()
                    await this.reset_hightlight_result()
                    await this.pause()
                    await this.highlightPath(rootD3, node)
                    await this.pause()
                    await this.sleep(time);
                    await this.pause()
                    this.show_data_change(node, this.animation_index)
                    await this.hightlight(this.code_row_animation[this.animation_index][0], this.code_row_animation[this.animation_index][1])
                    await this.changeColor(node);
                    await this.clear_hightlight()

                    // if(this.animation_index === this.action.length - 1) {
                    //     // await this.pause()
                    // }
                    if(this.animation_index === this.action.length - 1) {
                        dem = this.animation_index
                        while(dem--) {
                            let {node,time} = this.action[dem]
                            await this.changeColor(node, true)
                        }
                        await this.highlight_result(rootD3)
                        this.is_animation_end = true
                        break
                    }
                    this.animation_index += 1
                }
            }
        },

        clear_data(node) {
            let _this = this
            function cleaning(node) {
                if(node.children.length <= 0) return
                node.value = node.MOX === 0 ? "-inf" : "+inf"
                let nodeChild = node.children
                for(let i = 0; i < nodeChild.length; i++) {
                    cleaning(nodeChild[i])
                }
            }
            cleaning(node)
        },

        update_root(condition, update_list) {
            if(condition(root)) {
                update_list(root).forEach(({variable, data}) => {
                    root[variable] = data
                })
            }
            function update(node) {
                for(let child of node.children) {
                    update(child)
                    if(condition(child)) {
                        update_list(child).forEach(({variable, data}) => {
                            child[variable] = data
                        })
                    }
                }
            }
            update(root)
            this.generate_tree()
        },

        chooseNode(node) {
            this.selected_node = node
            node_name.value = node.data.name
            node_value.value = typeof node.data.default_value === "number" ? node.data.default_value : ""
        },

        addNode(selectedNode) {
            if (!selectedNode.data.children) {
                selectedNode.data.children = [];
            }
            let new_value = Math.floor(Math.random() * 100)
            selectedNode.data.value = selectedNode.data.MOX === 0 ? "-inf" : "+inf"
            selectedNode.data.default_value = selectedNode.data.MOX === 0 ? "-inf" : "+inf"
            const newNode = {
                name: `NewNode${Date.now()}`,
                value: new_value,
                default_value: new_value,
                depth: selectedNode.data.depth + 1,
                MOX: selectedNode.data.MOX === 0 ? 1 : 0,
                children: []
            };
            selectedNode.data.children.push(newNode);
            // rootD3 = d3.hierarchy(root);
            this.generate_tree(selectedNode);
        },

        deleteNode(targetNode, rootNode) {
            if (targetNode === rootNode) {
                console.error("Cannot delete the root node.");
                return;
            }
        
            // Tìm node cha của targetNode
            function findParentNode(node, targetNode) {
                if (!node.children) return null;
                for (let child of node.children) {
                    if (child.name === targetNode.data.name) {
                        return node;
                    }
                    let foundNode = findParentNode(child, targetNode);
                    if (foundNode) return foundNode;
                }
                return null;
            }
        
            // Xóa targetNode khỏi cây
            let parentNode = findParentNode(rootNode, targetNode);
            if (parentNode) {
                parentNode.children = parentNode.children.filter(child => child.name !== targetNode.data.name);
                if(parentNode.children.length <= 0) {
                    const new_value = Math.round(Math.random() * 100)
                    parentNode.default_value = typeof targetNode.data.value === "string" ? new_value : targetNode.data.default_value
                    parentNode.value = typeof targetNode.data.value === "string" ? new_value : targetNode.data.value
                }
            }
            this.generate_tree()
        },

        find_node(selectedNode) {
            function find(node = root) {
                for (let child of node.children) {
                    if (child.name === selectedNode.data.name) {
                        return child;
                    }
                    let foundNode = find(child, node);
                    if (foundNode) return foundNode;
                }
            }
            let result = find()
            return result
        },

        generate_tree(node) {
            this.clear_data(root)
            let _this = this
            // this.is_animation_end = true
            this.animation_index = 0
            // root = !isUpdate ? JSON.parse(JSON.stringify(data)) : root
            d3.select("g").remove()
            svg = d3.select("svg"),
            width = +svg.attr("width"),
            height = +svg.attr("height"),
            g = svg.append("g").attr("transform", "translate(0,100)");
            this.content = g
        
            tree = d3.tree().size([width, height - 160]);
            rootD3 = d3.hierarchy(root);
        
            tree(rootD3);
        
            nodes = rootD3.descendants();
            depth = nodes.reduce((depth, node) => node.depth > depth ? node.depth : depth, 0)

            links = rootD3.links();

            this.link = g.selectAll(".link")
            .data(links)
            .enter().append("path")
                .attr("class", "link")
                .attr("stroke", "#555")
                .attr("stroke-width", "2px")
                .attr("fill", "none")
                .attr("d", d3.linkVertical()
                    .x(d => d.x)
                    .y(d => d.y));

            // Vẽ các nút (nodes)
            this.node = g.selectAll(".node")
            .style("position", "relative")
            .data(nodes)
            .enter()
            .append("g")
            .on("click", async function(e,node_data) {
                await _this.reset_hightlight_result("node")
                d3.select(this).select("circle")
                .transition()
                .duration(20)
                .attr("stroke", "#007BFF")
                .attr("stroke-width", "3px")
                _this.chooseNode(node_data)
            })
            .attr("class", d => "node " + d.data.name)
            .attr("transform", d => `translate(${d.x},${d.y})`);

            this.node.append("circle")
            .attr("r", this.circle_r)
            .attr("fill", "#fff")
            .attr("stroke", "#999")
            .attr("stroke-width", "1px")

            this.node.append("text")
            .attr("dy", this.circle_r / 3)
            .attr("class", "text")
            .style("font-size", (this.circle_r) + "px")
            // .style("text-anchor", d => d.children ? "end" : "start")
            .text(d => `${typeof d.data.default_value === "number" ? d.data.default_value : ""}`);

            let add_node_btn = this.node.append("g")
            .attr("class", "add_node_btn")
            .on("click", (e, d) => {
                this.addNode(d)
            })
            // .attr("transform", d => `translate(${d.x},${d.y})`);

            add_node_btn.append("circle")
            .attr("r", (this.circle_r / 2.6))
            .attr("fill", "#ccc")

            add_node_btn.append('text')
            .attr("y", 3.2)
            .attr('font-family', 'FontAwesome')
            // .attr("font-size", (this.circle_r / 10) + "px")
            .attr("class", "icon fa")
            .style("font-size", (this.circle_r / 1.6) + "px")
            .attr("text-anchor", "middle")
            .attr("font-family", "FontAwesome")
            .text("\u002b") 

            let remove_node_btn = this.node.append("g")
            .attr("class", "remove_node_btn")
            .on("click", (e, node_data) => {
                const nodeToDelete = nodes.find(d => d.data.name === node_data.data.name); // Thay thế 'C1' bằng tên của node cần xóa
                if (nodeToDelete) {
                    this.deleteNode(nodeToDelete, root);
                }
            })
            // .attr("transform", d => `translate(${d.x},${d.y})`);

            remove_node_btn.append("circle")
            .attr("r", (this.circle_r / 2.6))
            .attr("fill", "#ccc")

            remove_node_btn.append('text')
            .attr("y", 3.2)
            .attr('font-family', 'FontAwesome')
            // .attr("font-size", (this.circle_r / 10) + "px")
            .attr("class", "icon fa")
            .style("font-size", (this.circle_r / 1.6) + "px")
            .attr("text-anchor", "middle")
            .attr("font-family", "FontAwesome")
            .text("\uf00d") 

            this.group = this.node.filter(d => d.data.children.length > 1).append("g").attr("class", "node_log");

            // Thêm hình chữ nhật
            this.group.append("rect")
                .attr("width", 40)
                .attr("height", 20)
                .attr("y", 20)
                .attr("x", -20)
                .attr("cy", 20)
                .attr("cx", -15)
                .attr("fill", "none")

            // Thêm văn bản
            this.group.append("text")
                .attr("class", "text")
                .style("font-size", (this.circle_r) / 1.4 + "px")
                .attr("x", 0) // Điều chỉnh vị trí x của văn bản
                .attr("y", 35 + (this.circle_r) / 1.4) // Điều chỉnh vị trí y của văn bản
                .attr("opacity", 0)

            
            this.run_algorithm("minimax")
            minimax_list.innerHTML = new Array(depth + 1).fill(0).map((_, i) => {
                const MOX = nodes.find(item => item.depth === i).data.MOX
                return `
                <li class="minimax_item">
                    <div>Hàng ${i+1}</div>
                    <select name="" id="" class="MOX_list">
                        <option ${MOX === 0 ? "selected" : ""} value="0" class="MOX_item">max</option>
                        <option ${MOX !== 0 ? "selected" : ""} value="1" class="MOX_item">min</option>
                    </select>
                </li>
            `
            }).join("")
            const MOX_list = $$(".MOX_list")
            MOX_list.forEach((item, i) => {
                item.onchange = () => {
                    _this.update_root((node) => node.depth === i, 
                    (node) => {
                        return [
                            {variable: "MOX", data: Number(item.value)},
                            {variable: "default_value", data: typeof node.default_value === "number" ? node.default_value : (Number(item.value) === 0 ? "-inf" : "+inf")}
                        ]
                    })
                }
            })
        },

        handle_event() {
            node_name.oninput = () => {
                this.find_node(this.selected_node).name = node_name.value
                this.generate_tree(this.selected_node)
            }
            node_value.oninput = () => {
                if(this.selected_node.data.children.length === 0) {
                    this.find_node(this.selected_node).default_value = Number(node_value.value)
                    this.generate_tree(this.selected_node)
                }
            }
        },

        Play() {
            this.isPaused = false
            play_pause_btn.checked = true
        },

        Pause() {
            this.isPaused = true
            play_pause_btn.checked = false
        },

        async start() {
            // this.clear_variable()
            this.generate_tree()
            this.handle_event()
        }
    })
}