async function fetchRequest(url, method, body) {
  try {
    const options = { method };
    if (body !== undefined) options.body = JSON.stringify(body);
    const res = await fetch(`${window.API}/${url}`, options);
    if (res.status === 400) return [null, await res.json()];
    if (res.status === 429) return [null, new Error('Too many requests')];
    return [await res.json(), null];
  } catch (err) {
    console.error(err);
    return [null, err];
  }
}

export const fetchGet  = (url)        => fetchRequest(url, 'GET');
export const fetchPost = (url, body)  => fetchRequest(url, 'POST', body);
export const fetchPut  = (url, body)  => fetchRequest(url, 'PUT', body);

export function pwUrlBuilder(state, teamPassword = null) {
  const isAdmin = state.privilage === 'admin';
  const pw   = isAdmin ? state.adminPassword : (state.generalPassword || state.adminPassword);
  const type = isAdmin ? 'admin' : 'general';
  let url = `${state.boardName}/${pw}/${type}`;
  if (state.teamPasswordsRequired && teamPassword) url += `/${teamPassword}`;
  return url;
}
