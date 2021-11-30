export function coupon(data, withPet = false){
	class TreeNode {
	  constructor(item, possibleChildren, parent=null) {
	    this.item = item;
	    this.descendants = [];
	    this.parent = parent;
	    this.possibleChildren = possibleChildren

	    this.newTotalWeight = null
	    this.cumulativeRate = null
	    if(parent && parent.newTotalWeight && parent.cumulativeRate) {
	    	this.newTotalWeight = parent.newTotalWeight - this.item.rate
	    	this.cumulativeRate = (this.item.rate / parent.newTotalWeight) * this.parent.cumulativeRate
	    } else {
	    	if (this.item) {
	    		this.newTotalWeight = totalRate - this.item.rate
	    		this.cumlativeRate = this.item.rate/totalRate
	    	} else {
	    		this.newTotalWeight = totalRate
	    		this.cumulativeRate = 1
	    	}
	    }
		}

	  addDecendant(node){
	  	this.descendants.push(node)
	  }	
	}

	let totalRate = 0;
	data.items.forEach((item)=> {
		totalRate += item.rate
	})
	//this if factorial growth and explodes around here
	if (data.items.length>10){
		return null
	}
	let startNode = buildTree(totalRate)
	let rolls = calculateRolls(startNode, 0)
	return rolls

	function calculateRolls(node, total){
		if (node.descendants.length === 0){
			return total
		} else {

			let chance = data.chance/100
			if (!node.item) {
				total += (1/chance)
			} else {
				total += (1/(chance * (node.newTotalWeight/totalRate)))* node.cumulativeRate
			}

			for (let i=0; i<node.descendants.length; i++){
				total = calculateRolls(node.descendants[i], total)
			}
			return total
		}
	}

	function buildTree(totalRate){

		let startNode = new TreeNode(null, data.items, null)

		recursiveAddChildren(startNode)

		//recursivePrintTree(startNode, 0)

		return startNode;

	}

	function recursiveAddChildren(node){
		if (node.possibleChildren.length === 0){
			return 
		} else {
			console.log(node.item)
			node.possibleChildren.forEach(child => {
				let childrenCopy = [...node.possibleChildren]
				let index = childrenCopy.findIndex(item => {
					return item.name === child.name
				})
				let item = childrenCopy.splice(index,1)[0]
				let newNode = new TreeNode(item, childrenCopy, node)
				node.addDecendant(newNode)
				recursiveAddChildren(newNode)
			})
		}
	}

	// function recursivePrintTree(node, index){
	// 	index += 1
	// 	console.log('Tree depth: ' + index)
	// 	console.log('Item:' + JSON.stringify(node.item))
	// 	console.log('Cumulative rate: ' + node.cumulativeRate, node.newTotalWeight)
	// 	if (node.descendants.length === 0){
	// 		return
	// 	} else {
	// 		for (let i=0; i<node.descendants.length; i++){
	// 			recursivePrintTree(node.descendants[i], index)
	// 		}
	// 	}
	// }

}
