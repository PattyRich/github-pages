export function totalLooter(data, rolls) {
	// return new Promise((resolve, reject) => {
	// 	resolve(totalLoot(data))
	// }
	return totalLoot(data, rolls)
}

function random_generator(max, min) {
	return Math.random() * (max - min) + min
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max) + 1;
}

function totalLoot(data, rolls){

	let loot = []

	console.log(data)

	for(let i=0; i<data.length; i++){
		let amount = 0
		for (let j=0; j<rolls; j++) {
			let rng = Math.random()
			if (rng < data[i].rarity)
				if (data[i].quantity.includes('-')){
					let range = data[i].quantity.split('-')
					let amt = Math.round(random_generator(Number(range[0]),(Number(range[1]))))
					amount += amt
				} else {
					amount += Number(data[i].quantity)
				}
		}
		loot.push({name: data[i].name, amount: amount})
	}

	return loot
}