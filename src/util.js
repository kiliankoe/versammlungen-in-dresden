export async function getAllStatuses(masto, accountId, limit = 40) {
  let loadMore = true;
  let maxId = null;
  let statuses = [];

  while (loadMore) {
    const response = await masto.v1.accounts
      .$select(accountId)
      .statuses.list({ limit, maxId });

    statuses = statuses.concat(response);

    if (response.length < limit) {
      loadMore = false;
    }

    if (response.length > 0) {
      maxId = response[response.length - 1].id;
    }
  }

  return statuses;
}

export async function fetchAssemblies() {
  const assembliesURL = "https://www.dresden.de/data_ext/versammlungsuebersicht/Versammlungen.json";
  const assembliesData = await fetch(assembliesURL);
  return await assembliesData.json();
}
