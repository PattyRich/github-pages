import {completion} from './completion'

export function loot(rolls, place, options = {points: 30000, runCompletion: false, pets: true}) {
	return new Promise((resolve, reject) => {
		
		//sloppy fix but just a bypass so the import doesn't stop us. dont' want to scrape out all the logic that helps us
		let create = false
		if (place === 'create') {
			place = 'cg'
			create = true
		}

		import('./' + place)
			.then((datax) => {
				//need a completely fresh copy since deleteing the pet perm deletes it from the file as well
				//that happens since its a .js file and not json
				let data = JSON.parse(JSON.stringify(datax)).data

				//sloppy fix from above^^
				if (create){
					data = JSON.parse(JSON.stringify(options.createData))
				
					if (!options.pets) {
						delete data.pet
					}
					if (data.pet && typeof data.pet.rate == 'string') {					
						data.pet.rate = Number(data.pet.rate.split('/')[1])
					}

				//changing create your own boss rates to numbers
					data.items.forEach((item, index, arr)=> {
						if (typeof item.rate == 'string') {
							let split = item.rate.split('/')
							try {
								arr[index].rate = parseFloat(split[0])/parseFloat(split[1])
							} catch (err) {
								console.log(err)
							}
						}
					})
				}

				//chance is the odds that you get a unique drop. 
				//this can be useful to preset, for stuff like raids since it varys and somtimes 1/1000 for stuff like tbow just seems weird
				//in those cases the weight doesn't have to equal a 1/blah fraction
				//but if we are using a 1/blah we'll know the chance cause we can just sum them
				if(!data.chance){
					let sum = 0
					data.items.forEach((item)=> {
						sum += item.rate
					})
					data.chance = sum * 100
				}

				if (data.name === 'cox') {
					data.chance = (options.points / 8678)
				}
				if (data.pet) {
					if (!options.pets){
						data.pet.getPet = false
					} else {
						data.pet.getPet = true
					}
				}

				if (options.runCompletion){
					resolve(completion(data))
				}
				resolve(looter(rolls, data))
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

	if (data.pet && data.pet.getPet){
		checkList.push(0)
	}

	// if(data.name === 'cg') {
	// 	checkList[2] -= 1
	// }

	for (let i=0; i<rolls; i++) {

		rollItem(i)

		//seperated this out so that we could run it multiple times for zulrah or multi drop bosses
		if (data.name === 'zulrah'){
			rollItem(i)
		}

		rollPet(i)
		if (finish) {
			if (!checkList.some(item => item <= 0)){
				break
			}
		}
	}

	return rewards

	function rollItem(kcc){
		let rng = Math.random() * 100
		//they got loot

		if (rng < data.chance) {
			let item_per = random_generator(itemWeights,0)

			let cnt = 0
			for (let j=0; j<data.items.length; j++) {	
				cnt += data.items[j].rate
				if (cnt >= item_per) {
					rewards.push({
						kc: kcc+1,
						name: data.items[j].name
					})
					checkList[j] += 1
					break
				}
			}
		} 	
	}

	function rollPet(kc){
		if (!data.pet){
			return
		}
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
