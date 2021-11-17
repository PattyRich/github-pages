export function loot(rolls, place, points=30000) {
	return new Promise((resolve, reject) => {
		import('./' + place)
			.then((data) => {
				if (data.data.name === 'cox') {
					data.data.chance = (points / 8678)
				}
				resolve(looter(rolls, data.data))
			})
	});
}


function random_generator(max, min) {
	return Math.random() * (max - min) + min
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max) + 1;
}


function looter(rolls, data) {
	let rewards = []
	let finish = rolls === 'f'
	let checkList = []

	if (finish) {
		rolls = 1000000
	}

	let itemWeights = 0
	data.items.map(item => {
		itemWeights += item.rate
		checkList.push(0)
	})
	checkList.push(0)

	if(data.name === 'cg') {
		checkList[2] -= 1
	}

	for (let i=0; i<rolls; i++) {
		let rng = Math.random() * 100
		//they got loot

		if (rng < data.chance) {
			let item_per = random_generator(itemWeights,0)

			let cnt = 0
			for (let j=0; j<rolls; j++) {	
				cnt += data.items[j].rate
				if (cnt >= item_per) {
					rewards.push({
						kc: i+1,
						name: data.items[j].name
					})
					checkList[j] += 1
					break
				}
			}
		} 

		rollPet(i)
		if (finish) {
			if (!checkList.some(item => item <= 0))
				break
		}
	}

	return rewards

	function rollPet(kc){
		let x = getRandomInt(data.pet.rate)
		if (x === data.pet.rate){
			if (data.name === 'cox') {
				if (rewards.length && rewards[rewards.length-1].kc === kc+1){
					rewards.push({
						kc: kc+1,
						name: data.pet.name
					})		
					checkList[checkList.length-1] +=1
				} 
			} else {
				rewards.push({
					kc: kc+1,
					name: data.pet.name
				})	
				checkList[checkList.length-1] +=1				
			}
		}
	}
}

