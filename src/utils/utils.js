async function fetchPost(url, body) {
  try {
    let data = await fetch(`${window.API}/${url}`, { 
      method: 'POST',
      body : JSON.stringify(body)
    });
    if (data.status === 400) {
      return [null, await data.json()]
    }
    if (data.status === 429) {
      return [null, new Error('Too many requests')]
    }
    let dataJson = await data.json()
    return [dataJson, null]
  } catch (err) {
    console.log(err)
    return [null, err]
  }
} 

async function fetchPut(url, body) {
  try {
    let data = await fetch(`${window.API}/${url}`, { 
      method: 'PUT',
      body : JSON.stringify(body)
    });
    if (data.status === 400) {
      return [null, await data.json()]
    } 
    if (data.status === 429) {
      return [null, new Error('Too many requests')]
    }
    let dataJson = await data.json()
    return [dataJson, null]
  } catch (err) {
    console.log(err)
    return [null, err]
  }
} 

async function fetchGet(url) {
  try {
    let data = await fetch(`${window.API}/${url}`);
    if (data.status === 400) {
      return [null, await data.json()]
    }
    if (data.status === 429) {
      return [null, new Error('Too many requests')]
    }
    let dataJson = await data.json()
    return [dataJson, null]
  } catch (err) {
    console.log(err)
    return [null, err]
  }
} 

function pwUrlBuilder(state) {
  let pwData = {}
  if (state.privilage == 'admin') {
    pwData.pw = state.adminPassword
    pwData.type = 'admin'
  } else {
    pwData.pw = state.generalPassword || state.adminPassword
    pwData.type = 'general'
  }
  return `${state.boardName}/${pwData.pw}/${pwData.type}`
}

export {fetchPost, fetchGet, fetchPut, pwUrlBuilder}
