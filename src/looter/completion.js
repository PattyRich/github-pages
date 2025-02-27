const getAllSubsets = 
      theArray => theArray.reduce(
        (subsets, value) => subsets.concat(
         subsets.map(set => [value,...set])
        ),
        [[]]
      );


const pascalRow = (num) => {
   const res = []
   while (res.length <= num) {
      res.unshift(1);
      for(let i = 1; i < res.length - 1; i++) {
         res[i] += res[i + 1];
      };
   };
   return res
};

const reducer = (previousValue, currentValue) => previousValue + currentValue;


export function completion(data) {
	let x = []

	let totalWeight = 0
	data.items.forEach((item)=> {
		totalWeight += item.rate
	})

	data.items.forEach((item)=> {
		x.push((item.rate/totalWeight) * (data.chance/100))
	})

	x.push(1-x.reduce(reducer))

	//this function is factorial and gets too long around here
	if (x.length > 20){
		return []
	}

	let subSets = getAllSubsets(x)
	console.log(subSets)
	// subsets will follow pascals triangle for amount of items in each "size"
	// assuming the starting x length was 4 (triangle) [1,4,6,4,1] (1's) on edge are [] and [all items]
	// the subsets that have 0 items will be 1
	// the subsets that have 1 items will be 4
	// the subsets that have 2 items will be 6 
	// the subsets that have 3 items will be 4
	// the subsets that have 4 items will be 1
	// this is used below by getting the index of the first item in each subset so we know
	// which items in that range should be used in the calc

	subSets.sort((item1, item2)=> {
		return item1.length >= item2.length ? 1 : -1
	})

	let pascal = pascalRow(x.length)

	let total = 0

	// https://en.wikipedia.org/wiki/Coupon_collector%27s_problem
	
	for(let i=0; i<x.length; i++) {
		let mult = Math.pow(-1,(x.length -1 - i))
		for (let j=0; j<pascal[i]; j++) {
			if (i === 0){
				total += mult * 1
				continue
			}
			let index = pascal.slice(pascal.length-i).reduce(reducer)
			total += mult * (1/(1-(subSets[index+j].reduce(reducer))))
		}
	}	

	//zulrah = double loots probably scews data a lil bit since pet is getting 2x rate it should whatever
	if(data.name === 'zulrah') {
		return Math.round(total/2)
	}
	return Math.round(total)
}

// let x = [1/1365, 1/1365, 1/4095]

// function start() {
//   startTime = new Date();
// };

// function end() {
//   endTime = new Date();
//   var timeDiff = endTime - startTime; //in ms
//   // strip the ms
//   timeDiff /= 1000;

//   // get seconds 
//   var seconds = timeDiff
//   console.log(seconds + " seconds");
// }

// var startTime, endTime;

// for (let i=0; i<30; i++) {
// 	let y = [...x]
// 	for (let j=0; j<i; j++){
// 		y.push(1/1365)
// 	}
// 	y.push(1-y.reduce(reducer))

// 	console.log('Size of data = ' + y.length)
// 	start()
// 	completion(y)
// 	end()

// }




