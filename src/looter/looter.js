import {completion} from './completion'
import { cluesLvl } from '../routes/osrs';

const teamActivites = ['nex', 'tob']

export function loot(rolls, place, options = {points: 30000, runCompletion: false, pets: true, cms: false, teamSize: 1}) {
	return new Promise((resolve, reject) => {
		
		//sloppy fix but just a bypass so the import doesn't stop us. dont' want to scrape out all the logic that helps us
		let create = false
		if (place === 'create') {
			place = 'cg'
			create = true
		}

		let clues = false
		if (place === 'clues') {
			place = 'cg'
			clues = true
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

				let clueType = null;
				if (clues) {
					clueType = options.clue
					data = {name: 'clues', items: []}
					if (!options.cluesData){
						return;
					}
					options.cluesData[options.clue].sobj.forEach((item)=> {
						let itemJson =  JSON.parse(item.data[0].dataitem[0].item);
						if (['Always', 'Common'].includes(itemJson['Rarity'])) {
							return;
						}
						let evall = eval(itemJson['Rarity'].replace(',',''));
						//slightly more common that beginner rares to weed out common items
						if (evall > .0028) {
							return;
						}
						data.items.push({name: itemJson['Dropped item'], rate: evall})
					})
				}

				//rates will be changed due to extra people (tob and nex)
				if (teamActivites.includes(data.name)){
					data.items.forEach((item)=> {
						item.rate /= options.teamSize
					})				
					//only nex pet rate scales with team size unlike tob
					if (data.name === 'nex')
						data.pet.rate *= options.teamSize
				}

				//chance is the odds that you get a unique drop. 
				//this can be useful to preset, for stuff like raids since it varys and somtimes 1/1000 for stuff like tbow just seems weird
				//in those cases the weight doesn't have to equal a 1/blah fraction
				//but if we are using a 1/blah we'll know the chance cause we can just sum them
				if(!data.chance){
					if (options.runCompletion) {
						//remove extra items from completion calc
						let dataClean = [...data.items]
						dataClean = dataClean.filter((item)=>{
							return !item.extra
						})
						data.items = dataClean

						//add 2 more vestige drops if dt2
						let vestige = data.items.find((item)=> {
							return item.name.includes('vestige');
						});
					
						if (vestige) {
							data.items.push(vestige);
							data.items.push(vestige);
						}
					}
					//toa uses an equation for rate fit since the calculations are too confusing otherwise.
					//i got this equation by plotting calculator data in wolfram 
					if (data.eq) {
						data.chance = eval(data.eq.replaceAll('x',options.invocation))
						data.pet.rate = Math.round(1/(eval(data.pet.rate.replaceAll('x',options.invocation))/100))
					} else {
						let sum = 0
						data.items.forEach((item)=> {
							sum += item.rate
						})
						data.chance = sum * 100		
					}
				}

				if (data.name === 'cox') {
					data.chance = (options.points / 8678)
					if (options.cms) {
						data.rollCms = true
					}
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
					return;
				}
				resolve(looter(rolls, data, clueType))
			})
	});
}


function random_generator(max, min) {
	return Math.random() * (max - min) + min
}

function randomIntFromInterval(max, min) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max) + 1;
}


function looter(rolls, data, clueType) {
	console.log(data)
	let rewards = []
	let finish = rolls === 'f'
	let checkList = []

	data.items.sort((item1)=> {
		return item1.extra === true ? 1 : -1
	});

	if (finish) {
		rolls = 1000000
	}

	let itemWeights = 0
	data.items.forEach(item => {
		itemWeights += item.rate
		if(!item.extra){
			checkList.push(0)
		}
	})

	if (data.pet && data.pet.getPet){
		checkList.push(0)
	}

	let dt2 = 0;
	let dt2Check = false;
	if (['duke', 'vardorvis', 'leviathan', 'whisperer'].includes(data.name)) {
		dt2Check = true;
	}

	for (let i=0; i<rolls; i++) {

		rollItem(i)

		//seperated this out so that we could run it multiple times for zulrah or multi drop bosses
		if (data.name === 'zulrah'){
			rollItem(i)
		}

		//previous check only adds if this is cox
		if (data.rollCms){
			rollItemAdHoc(i, data.cms)	
		}

		if (clueType){
			let numRolls = getClueMultiRolls(clueType)
			for (let j=1; j<numRolls; j++) {
				rollItemAdHoc(i, data.items, true)
			}
		}

		rollPet(i)
		if (finish) {
			if (!checkList.some(item => item <= 0)){
				break
			}
		}
	}
	
	if (clueType) {
		return cleanClueRewards(rewards);
	}

	if (data.allPets) {
		rewards[0].rate = rewards[0].kc/(1/(data.items[0].rate))
	}
	return rewards


	function rollItemAdHoc(kc, items, checkListBool = false){
		let rng = Math.random()
		//they got loot
		let weight = 0

		items.forEach(item => {
			weight += item.rate
		})	

		if (rng < weight) {
			let item_per = random_generator(weight,0)
			let cnt = 0
			for (let j=0; j<items.length; j++) {	
				cnt += items[j].rate
				if (cnt >= item_per) {
					if (items[j].name === 'Bloodhound') {
						return;
					}
					rewards.push({
						kc: kc+1,
						name: items[j].name
					})
					if (checkListBool) {
						checkList[j] += 1
					}
					break
				}
			}
		} 	
	}

	function rollItem(kcc){
		let rng = Math.random() * 100
		//they got loot

		if (rng < data.chance) {
			let item_per = random_generator(itemWeights,0)

			let cnt = 0
			for (let j=0; j<data.items.length; j++) {	
				cnt += data.items[j].rate
				if (cnt >= item_per) {
					if (dt2Check) {
						if (data.items[j].name.includes('vestige')) {
							dt2 +=1
							if (dt2 > 2) {
								dt2=0
							} else {
								return
							}
						}
					}
					rewards.push({
						kc: kcc+1,
						name: data.items[j].name
					})
					if (!data.items[j].extra){
						checkList[j] += 1
					}
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
				if (rewards.length && rewards[rewards.length-1].kc === kc+1 && !['Twisted ancestral colour kit', 'Metamorphic dust'].includes(rewards[rewards.length-1].name)){
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

function getClueMultiRolls (clueType) {
	if (clueType === cluesLvl[0]) {
		return randomIntFromInterval(3,1)
	}
	if (clueType === cluesLvl[1]) {
		return randomIntFromInterval(4,2)
	}
	if (clueType === cluesLvl[2]) {
		return randomIntFromInterval(5,3)
	}
	if (clueType === cluesLvl[3]) {
		return randomIntFromInterval(6,4)
	}
	if (clueType === cluesLvl[4]) {
		return randomIntFromInterval(6,4)
	}
	if (clueType === cluesLvl[5]) {
		return randomIntFromInterval(7,5)
	}
}

function cleanClueRewards(rewards) {
	let rewardsCleaned = []
	rewards.forEach((reward)=> {
		let index = rewardsCleaned.findIndex((item) => {return item.name === reward.name})
		if (index < 0){
			rewardsCleaned.push({...reward, quantity: 1})
		} else {
			rewardsCleaned[index].quantity +=1
		}
	})
	return rewardsCleaned;
}
