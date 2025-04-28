export async function getAllStatuses(masto, accountId, { limit = 40, max } = {}) {
  let loadMore = true;
  let maxId = null;
  let statuses = [];

  while (loadMore) {
    const response = await masto.v1.accounts
      .$select(accountId)
      .statuses.list({ limit, maxId });

    statuses = statuses.concat(response);

    if (statuses.length >= max) {
      loadMore = false;
    }

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
  const retries = 3;
  const delay = 10_000;

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1} to fetch assemblies from ${assembliesURL}...`);
      const assembliesData = await fetch(assembliesURL, { timeout: 10_000 });
      if (!assembliesData.ok) {
        throw new Error(`HTTP error! Status: ${assembliesData.status}`);
      }
      const jsonData = await assembliesData.json();
      return jsonData;
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed: ${error}`);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error("All fetch attempts failed.");
        throw error;
      }
    }
  }
  throw new Error("Failed to fetch assemblies after multiple retries.");
}
