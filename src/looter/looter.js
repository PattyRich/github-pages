import {completion} from './completion'

export function loot(rolls, place, options = {points: 30000, runCompletion: false, pets: true}) {
	return new Promise((resolve, reject) => {
		import('./' + place)
			.then((datax) => {
				//need a completely fresh copy since deleteing the pet perm deletes it from the file as well
				//that happens since its a .js file and not json
				let data = JSON.parse(JSON.stringify(datax))
				if (data.data.name === 'cox') {
					data.data.chance = (options.points / 8678)
				}
				if (!options.pets){
					data.data.pet.getPet = false
				} else {
					data.data.pet.getPet = true
				}
				if (options.runCompletion){
					resolve(completion(data.data))
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
	data.items.forEach(item => {
		itemWeights += item.rate
		checkList.push(0)
	})

	if (data.pet.getPet){
		checkList.push(0)
	}

	// if(data.name === 'cg') {
	// 	checkList[2] -= 1
	// }

	for (let i=0; i<rolls; i++) {
		let rng = Math.random() * 100
		//they got loot

		if (rng < data.chance) {
			let item_per = random_generator(itemWeights,0)

			let cnt = 0
			for (let j=0; j<data.items.length; j++) {	
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
			if (!checkList.some(item => item <= 0)){
				break
			}
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
					if (data.pet.getPet)
						checkList[checkList.length-1] +=1
				} 
			} else {
				rewards.push({
					kc: kc+1,
					name: data.pet.name
				})	
				if (data.pet.getPet)
					checkList[checkList.length-1] +=1				
			}
		}
	}
}

